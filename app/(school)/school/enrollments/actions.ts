"use server";

import { getServerAuth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  BillingType,
  Currency,
  DiscountType,
  EnrollmentStatus,
  InvoiceType,
  PaymentStatus,
  UserRole,
} from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma/client";
import { emptyToUndefined, formDataToObject } from "@/lib/form-utils";
import {
  enrollmentAttendanceSchema,
  enrollmentActorRoleSchema,
  enrollmentCreateSchema,
  enrollmentProgressSchema,
  enrollmentUpdateSchema,
} from "@/lib/validators";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import {
  buildDueDateForPeriod,
  calculateDiscountAmount,
  getBillingPeriod,
  normalizeBillingDay,
} from "@/lib/billing";
import { paginateQuery } from "@/lib/pagination";

export type EnrollmentActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const ENROLLMENT_ALLOWED_ROLES = new Set<UserRole>([
  UserRole.SCHOOL_ADMIN,
  UserRole.SUPER_ADMIN,
]);

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

async function requireEnrollmentActor() {
  const session = await getServerAuth();
  if (!session?.user?.id || !session.user.schoolId) {
    return { ok: false as const, message: "Unauthorized." };
  }

  const roleParsed = enrollmentActorRoleSchema.safeParse(session.user.role);
  if (!roleParsed.success || !ENROLLMENT_ALLOWED_ROLES.has(session.user.role)) {
    return {
      ok: false as const,
      message: "Only staff/admin can enroll students.",
    };
  }

  return {
    ok: true as const,
    schoolId: session.user.schoolId,
  };
}

export async function enrollStudent(
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  const actor = await requireEnrollmentActor();
  if (!actor.ok) {
    return { status: "error", message: actor.message };
  }

  const schoolId = actor.schoolId;
  const raw = formDataToObject(formData);
  const parsed = enrollmentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const student = await prisma.student.findFirst({
    where: { id: parsed.data.studentId, schoolId },
    select: { id: true },
  });
  const tenant = await prisma.tenant.findFirst({
    where: { id: schoolId },
    select: { billingDayOfMonth: true },
  });

  if (!student) {
    return { status: "error", message: "Selected student is invalid." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const sectionRows = await tx.$queryRaw<
        Array<{ capacity: number; fee: string; billingType: BillingType }>
      >`
        SELECT s."capacity", c."fee", c."billingType"
        FROM "Section" s
        INNER JOIN "Class" c ON c."id" = s."classId"
        WHERE s."id" = ${parsed.data.sectionId}
          AND s."schoolId" = ${schoolId}
          AND s."isDeleted" = false
        FOR UPDATE
      `;

      const section = sectionRows[0];
      if (!section) {
        throw new Error("Selected section is invalid.");
      }

      const duplicate = await tx.enrollment.findFirst({
        where: {
          schoolId,
          studentId: parsed.data.studentId,
          sectionId: parsed.data.sectionId,
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new Error("This student is already enrolled in the selected section.");
      }

      const enrolledCount = await tx.enrollment.count({
        where: {
          schoolId,
          sectionId: parsed.data.sectionId,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      if (enrolledCount >= section.capacity) {
        throw new Error("Section is full.");
      }

      const originalAmount = new Prisma.Decimal(section.fee).div(section.capacity);
      const parsedDiscountType = parsed.data.discountType as DiscountType;
      const parsedDiscountValue = new Prisma.Decimal(parsed.data.discountValue);
      const discount = calculateDiscountAmount({
        originalAmount,
        discountType: parsedDiscountType,
        discountValue: parsedDiscountValue,
      });
      const finalAmount = originalAmount.sub(discount);
      const billingType = section.billingType ?? BillingType.ONE_TIME;
      const billingDayOfMonth = normalizeBillingDay(tenant?.billingDayOfMonth);
      const enrollmentPeriod = getBillingPeriod(parsed.data.enrolledAt);

      const enrollment = await tx.enrollment.create({
        data: {
          schoolId,
          studentId: parsed.data.studentId,
          sectionId: parsed.data.sectionId,
          enrolledAt: parsed.data.enrolledAt,
          billingType,
          billingDayOfMonth,
          monthlyBillingActive: billingType === BillingType.MONTHLY,
          monthlyStartYear:
            billingType === BillingType.MONTHLY ? enrollmentPeriod.billingYear : null,
          monthlyStartMonth:
            billingType === BillingType.MONTHLY ? enrollmentPeriod.billingMonth : null,
          discountType: parsedDiscountType,
          discountValue: parsedDiscountValue,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      const dueDate =
        billingType === BillingType.MONTHLY
          ? buildDueDateForPeriod({
              billingYear: enrollmentPeriod.billingYear,
              billingMonth: enrollmentPeriod.billingMonth,
              billingDayOfMonth,
            })
          : getDefaultDueDate();

      const dueDatePeriod = getBillingPeriod(dueDate);
      await tx.invoice.create({
        data: {
          schoolId,
          studentId: parsed.data.studentId,
          enrollmentId: enrollment.id,
          invoiceType:
            billingType === BillingType.MONTHLY
              ? InvoiceType.MONTHLY
              : InvoiceType.ONE_TIME,
          billingYear: dueDatePeriod.billingYear,
          billingMonth: dueDatePeriod.billingMonth,
          originalAmount,
          discount,
          finalAmount,
          paidAmount: new Prisma.Decimal(0),
          status: PaymentStatus.UNPAID,
          dueDate,
        },
      });
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to enroll student.";
    console.error("enrollStudent failed", error);
    return { status: "error", message };
  }

  revalidatePath("/school/enrollments");
  revalidatePath("/school/attendance");
  revalidatePath("/school/students");
  revalidatePath("/school/payments");
  revalidatePath("/school/sections");
  return { status: "success", message: "Student enrolled and invoice created." };
}

export async function getEnrollments(filters?: {
  sectionId?: string;
  studentId?: string;
  date?: Date;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  return prisma.enrollment.findMany({
    where: {
      schoolId,
      ...(filters?.sectionId ? { sectionId: filters.sectionId } : {}),
      ...(filters?.studentId ? { studentId: filters.studentId } : {}),
      ...(filters?.date
        ? {
            attendance: {
              some: {
                date: filters.date,
              },
            },
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      status: true,
      enrolledAt: true,
      student: {
        select: {
          id: true,
          name: true,
        },
      },
      tenant: {
        select: {
          currency: true,
        },
      },
      section: {
        select: {
          id: true,
          name: true,
          class: {
            select: {
              name: true,
              fee: true,
              billingType: true,
            },
          },
        },
      },
      invoices: {
        select: {
          id: true,
          invoiceType: true,
          billingYear: true,
          billingMonth: true,
          originalAmount: true,
          discount: true,
          finalAmount: true,
          paidAmount: true,
          status: true,
          dueDate: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      progress: {
        select: {
          id: true,
          progress: true,
          remark: true,
          updatedAt: true,
        },
        take: 1,
      },
    },
  });
}

export async function getPaginatedEnrollments({
  page,
}: {
  page: number;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  return paginateQuery({
    page,
    count: () => prisma.enrollment.count({ where: { schoolId } }),
    query: ({ skip, take }) =>
      prisma.enrollment.findMany({
        where: { schoolId },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take,
        select: {
          id: true,
          status: true,
          enrolledAt: true,
          student: {
            select: {
              id: true,
              name: true,
            },
          },
          tenant: {
            select: {
              currency: true,
            },
          },
          section: {
            select: {
              id: true,
              name: true,
              class: {
                select: {
                  name: true,
                  fee: true,
                  billingType: true,
                },
              },
            },
          },
          invoices: {
            select: {
              id: true,
              invoiceType: true,
              billingYear: true,
              billingMonth: true,
              originalAmount: true,
              discount: true,
              finalAmount: true,
              paidAmount: true,
              status: true,
              dueDate: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          progress: {
            select: {
              id: true,
              progress: true,
              remark: true,
              updatedAt: true,
            },
            take: 1,
          },
        },
      }),
  });
}

export async function getEnrollmentFormOptions() {
  const actor = await requireEnrollmentActor();
  if (!actor.ok) {
    return { students: [], sections: [], currency: Currency.USD };
  }

  const schoolId = actor.schoolId;
  const [students, sections, activeEnrollmentCounts, tenant] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.section.findMany({
      where: { schoolId },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        capacity: true,
        class: { select: { name: true, fee: true, billingType: true } },
      },
    }),
    prisma.enrollment.groupBy({
      by: ["sectionId"],
      where: { schoolId, status: EnrollmentStatus.ACTIVE },
      _count: { _all: true },
    }),
    prisma.tenant.findFirst({
      where: { id: schoolId },
      select: { currency: true },
    }),
  ]);

  const enrolledMap = new Map(
    activeEnrollmentCounts.map((item) => [item.sectionId, item._count._all]),
  );

  return {
    currency: tenant?.currency ?? Currency.USD,
    students,
    sections: sections.map((section) => {
      const enrolledCount = enrolledMap.get(section.id) ?? 0;
      const isFull = enrolledCount >= section.capacity;
      return {
        id: section.id,
        name: `${section.class.name} • ${section.name}`,
        capacity: section.capacity,
        enrolledCount,
        isFull,
        perStudentFee: new Prisma.Decimal(section.class.fee)
          .div(section.capacity)
          .toString(),
        billingType: section.class.billingType,
      };
    }),
  };
}

export async function updateEnrollment(
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = enrollmentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const existing = await prisma.enrollment.findFirst({
    where: { id: parsed.data.id, schoolId },
    select: { id: true },
  });

  if (!existing) {
    return { status: "error", message: "Enrollment not found." };
  }

  try {
    await prisma.enrollment.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.status,
      },
    });
  } catch {
    return { status: "error", message: "Unable to update enrollment." };
  }

  revalidatePath("/school/enrollments");
  revalidatePath("/school/sections");
  return { status: "success", message: "Enrollment updated." };
}

export async function markAttendance(
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = enrollmentAttendanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: parsed.data.enrollmentId, schoolId },
    select: { id: true },
  });

  if (!enrollment) {
    return { status: "error", message: "Selected enrollment is invalid." };
  }

  try {
    await prisma.attendance.upsert({
      where: {
        enrollmentId_date: {
          enrollmentId: parsed.data.enrollmentId,
          date: parsed.data.date,
        },
      },
      create: {
        schoolId,
        enrollmentId: parsed.data.enrollmentId,
        date: parsed.data.date,
        status: parsed.data.status,
      },
      update: {
        status: parsed.data.status,
      },
    });
  } catch {
    return { status: "error", message: "Unable to save attendance." };
  }

  revalidatePath("/school/attendance");
  revalidatePath("/school/enrollments");
  revalidatePath("/school/analytics");
  return { status: "success", message: "Attendance saved." };
}

export async function getAttendanceRecords(filters?: {
  enrollmentId?: string;
  sectionId?: string;
  studentId?: string;
  date?: Date;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  return prisma.attendance.findMany({
    where: {
      schoolId,
      ...(filters?.enrollmentId ? { enrollmentId: filters.enrollmentId } : {}),
      ...(filters?.date ? { date: filters.date } : {}),
      ...(filters?.sectionId || filters?.studentId
        ? {
            enrollment: {
              ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
              ...(filters.studentId ? { studentId: filters.studentId } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 300,
    select: {
      id: true,
      date: true,
      status: true,
      enrollmentId: true,
      enrollment: {
        select: {
          student: { select: { id: true, name: true } },
          section: {
            select: {
              id: true,
              name: true,
              class: { select: { name: true } },
            },
          },
        },
      },
    },
  });
}

export async function getPaginatedAttendanceRecords({
  page,
  filters,
}: {
  page: number;
  filters?: {
    enrollmentId?: string;
    sectionId?: string;
    studentId?: string;
    date?: Date;
  };
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const where = {
    schoolId,
    ...(filters?.enrollmentId ? { enrollmentId: filters.enrollmentId } : {}),
    ...(filters?.date ? { date: filters.date } : {}),
    ...(filters?.sectionId || filters?.studentId
      ? {
          enrollment: {
            ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
            ...(filters.studentId ? { studentId: filters.studentId } : {}),
          },
        }
      : {}),
  };

  return paginateQuery({
    page,
    count: () => prisma.attendance.count({ where }),
    query: ({ skip, take }) =>
      prisma.attendance.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip,
        take,
        select: {
          id: true,
          date: true,
          status: true,
          enrollmentId: true,
          enrollment: {
            select: {
              student: { select: { id: true, name: true } },
              section: {
                select: {
                  id: true,
                  name: true,
                  class: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
  });
}

export async function updateProgress(
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = enrollmentProgressSchema.safeParse({
    ...raw,
    remark: emptyToUndefined(raw.remark as string | undefined),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: parsed.data.enrollmentId, schoolId },
    select: { id: true },
  });

  if (!enrollment) {
    return { status: "error", message: "Selected enrollment is invalid." };
  }

  try {
    await prisma.progress.upsert({
      where: { enrollmentId: parsed.data.enrollmentId },
      create: {
        schoolId,
        enrollmentId: parsed.data.enrollmentId,
        progress: parsed.data.progress,
        remark: parsed.data.remark,
      },
      update: {
        progress: parsed.data.progress,
        remark: parsed.data.remark,
      },
    });
  } catch {
    return { status: "error", message: "Unable to save progress." };
  }

  revalidatePath("/school/enrollments");
  return { status: "success", message: "Progress updated." };
}
