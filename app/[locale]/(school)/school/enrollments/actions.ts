"use server";

import { getServerAuth } from "@/auth";
import { revalidateLocalizedPath } from "@/lib/revalidate";
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
import { emptyToNull, formDataToObject } from "@/lib/form-utils";
import {
  enrollmentAttendanceSchema,
  enrollmentActorRoleSchema,
  enrollmentCreateSchema,
  enrollmentDetailsUpdateSchema,
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
import { containsInsensitive } from "@/lib/table-filters";

export type EnrollmentActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type EnrollmentTableFilters = {
  q?: string;
  status?: EnrollmentStatus;
  enrolledFrom?: Date;
  enrolledTo?: Date;
};

const ENROLLMENT_ALLOWED_ROLES = new Set<UserRole>([
  UserRole.SCHOOL_SUPER_ADMIN,
  UserRole.SCHOOL_ADMIN,
  UserRole.SUPER_ADMIN,
]);

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

function resolveInvoiceStatus(
  finalAmount: Prisma.Decimal,
  paidAmount: Prisma.Decimal,
) {
  if (paidAmount.lessThanOrEqualTo(0)) return PaymentStatus.UNPAID;
  if (paidAmount.greaterThanOrEqualTo(finalAmount)) return PaymentStatus.PAID;
  return PaymentStatus.PARTIAL;
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
        throw new Error(
          "This student is already enrolled in the selected section.",
        );
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

      const originalAmount = new Prisma.Decimal(section.fee).div(
        section.capacity,
      );
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
            billingType === BillingType.MONTHLY
              ? enrollmentPeriod.billingYear
              : null,
          monthlyStartMonth:
            billingType === BillingType.MONTHLY
              ? enrollmentPeriod.billingMonth
              : null,
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

  revalidateLocalizedPath("/school/enrollments");
  revalidateLocalizedPath("/school/attendance");
  revalidateLocalizedPath("/school/students");
  revalidateLocalizedPath("/school/payments");
  revalidateLocalizedPath("/school/sections");
  return {
    status: "success",
    message: "Student enrolled and invoice created.",
  };
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
  filters,
}: {
  page: number;
  filters?: EnrollmentTableFilters;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();
  const where: Record<string, unknown> = { schoolId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.enrolledFrom || filters?.enrolledTo) {
    where.enrolledAt = {
      ...(filters.enrolledFrom ? { gte: filters.enrolledFrom } : {}),
      ...(filters.enrolledTo ? { lte: filters.enrolledTo } : {}),
    };
  }

  if (filters?.q) {
    where.OR = [
      { student: { name: containsInsensitive(filters.q) } },
      { section: { name: containsInsensitive(filters.q) } },
      { section: { class: { name: containsInsensitive(filters.q) } } },
    ];
  }

  return paginateQuery({
    page,
    count: () => prisma.enrollment.count({ where }),
    query: ({ skip, take }) =>
      prisma.enrollment.findMany({
        where,
        orderBy: [{ enrolledAt: "desc" }],
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
  const [students, sections, activeEnrollmentCounts, tenant] =
    await Promise.all([
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

export async function getEnrollmentEditFormOptions(id: string) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const [enrollment, students, sections, activeEnrollmentCounts, tenant] =
    await Promise.all([
      prisma.enrollment.findFirst({
        where: { id, schoolId },
        select: {
          id: true,
          sectionId: true,
          enrolledAt: true,
          status: true,
          discountType: true,
          discountValue: true,
          student: { select: { id: true, name: true } },
          section: {
            select: {
              id: true,
              name: true,
              class: { select: { name: true, billingType: true } },
            },
          },
        },
      }),
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

  if (!enrollment) return null;

  const enrolledMap = new Map(
    activeEnrollmentCounts.map((item) => [item.sectionId, item._count._all]),
  );

  return {
    currency: tenant?.currency ?? Currency.USD,
    students,
    enrollment: {
      id: enrollment.id,
      sectionId: enrollment.sectionId,
      enrolledAt: enrollment.enrolledAt,
      status: enrollment.status,
      discountType: enrollment.discountType,
      discountValue: enrollment.discountValue.toString(),
      student: enrollment.student,
      sectionLabel: `${enrollment.section.class.name} • ${enrollment.section.name}`,
      billingType: enrollment.section.class.billingType,
    },
    sections: sections.map((section) => {
      const baseEnrolledCount = enrolledMap.get(section.id) ?? 0;
      const adjustedEnrolledCount =
        enrollment.status === EnrollmentStatus.ACTIVE &&
        enrollment.sectionId === section.id
          ? Math.max(0, baseEnrolledCount - 1)
          : baseEnrolledCount;
      const isFull = adjustedEnrolledCount >= section.capacity;

      return {
        id: section.id,
        name: `${section.class.name} • ${section.name}`,
        capacity: section.capacity,
        enrolledCount: adjustedEnrolledCount,
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

  revalidateLocalizedPath("/school/enrollments");
  revalidateLocalizedPath("/school/sections");
  return { status: "success", message: "Enrollment updated." };
}

export async function deleteEnrollment(
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { status: "error", message: "Enrollment id is required." };
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      _count: {
        select: {
          invoices: {
            where: {
              payments: { some: {} },
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    return { status: "error", message: "Enrollment not found." };
  }

  if (enrollment._count.invoices > 0) {
    return {
      status: "error",
      message:
        "This enrollment has payment history. Remove payments first before deleting.",
    };
  }

  try {
    await prisma.enrollment.delete({
      where: { id: enrollment.id },
    });
  } catch {
    return { status: "error", message: "Unable to delete enrollment." };
  }

  revalidateLocalizedPath("/school/enrollments");
  revalidateLocalizedPath("/school/attendance");
  revalidateLocalizedPath("/school/sections");
  revalidateLocalizedPath("/school/invoices");
  revalidateLocalizedPath("/school/payments");
  revalidateLocalizedPath("/school/analytics");
  return { status: "success", message: "Enrollment deleted." };
}

export async function updateEnrollmentDetails(
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = enrollmentDetailsUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: schoolId },
    select: { billingDayOfMonth: true },
  });
  const billingDayOfMonth = normalizeBillingDay(tenant?.billingDayOfMonth);

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.enrollment.findFirst({
        where: { id: parsed.data.id, schoolId },
        select: {
          id: true,
          studentId: true,
          sectionId: true,
          status: true,
        },
      });

      if (!existing) {
        throw new Error("Enrollment not found.");
      }

      const student = await tx.student.findFirst({
        where: {
          id: parsed.data.studentId,
          schoolId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (!student) {
        throw new Error("Selected student is invalid.");
      }

      const sectionRows = await tx.$queryRaw<
        Array<{ capacity: number; fee: string; billingType: BillingType }>
      >`
        SELECT s."capacity", c."fee", c."billingType"
        FROM "Section" s
        INNER JOIN "Class" c ON c."id" = s."classId"
        WHERE s."id" = ${parsed.data.sectionId}
          AND s."schoolId" = ${schoolId}
        FOR UPDATE
      `;

      const targetSection = sectionRows[0];
      if (!targetSection) {
        throw new Error("Selected section is invalid.");
      }

      if (
        existing.studentId !== parsed.data.studentId ||
        existing.sectionId !== parsed.data.sectionId
      ) {
        const duplicate = await tx.enrollment.findFirst({
          where: {
            schoolId,
            studentId: parsed.data.studentId,
            sectionId: parsed.data.sectionId,
            id: { not: existing.id },
          },
          select: { id: true },
        });

        if (duplicate) {
          throw new Error(
            "This student is already enrolled in the selected section.",
          );
        }
      }

      if (parsed.data.status === EnrollmentStatus.ACTIVE) {
        const activeCount = await tx.enrollment.count({
          where: {
            schoolId,
            sectionId: parsed.data.sectionId,
            status: EnrollmentStatus.ACTIVE,
            id: { not: existing.id },
          },
        });

        if (activeCount >= targetSection.capacity) {
          throw new Error("Section is full.");
        }
      }

      const billingType = targetSection.billingType ?? BillingType.ONE_TIME;
      const enrollmentPeriod = getBillingPeriod(parsed.data.enrolledAt);
      const parsedDiscountType = parsed.data.discountType as DiscountType;
      const parsedDiscountValue = new Prisma.Decimal(parsed.data.discountValue);
      const originalAmount = new Prisma.Decimal(targetSection.fee).div(
        targetSection.capacity,
      );
      const discount = calculateDiscountAmount({
        originalAmount,
        discountType: parsedDiscountType,
        discountValue: parsedDiscountValue,
      });
      const finalAmount = originalAmount.sub(discount);

      await tx.enrollment.update({
        where: { id: existing.id },
        data: {
          studentId: parsed.data.studentId,
          sectionId: parsed.data.sectionId,
          enrolledAt: parsed.data.enrolledAt,
          status: parsed.data.status,
          discountType: parsedDiscountType,
          discountValue: parsedDiscountValue,
          billingType,
          billingDayOfMonth,
          monthlyBillingActive: billingType === BillingType.MONTHLY,
          monthlyStartYear:
            billingType === BillingType.MONTHLY
              ? enrollmentPeriod.billingYear
              : null,
          monthlyStartMonth:
            billingType === BillingType.MONTHLY
              ? enrollmentPeriod.billingMonth
              : null,
        },
      });

      const latestUnpaidInvoice = await tx.invoice.findFirst({
        where: {
          schoolId,
          enrollmentId: existing.id,
          status: { in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          paidAmount: true,
        },
      });

      if (latestUnpaidInvoice) {
        const dueDate =
          billingType === BillingType.MONTHLY
            ? buildDueDateForPeriod({
                billingYear: enrollmentPeriod.billingYear,
                billingMonth: enrollmentPeriod.billingMonth,
                billingDayOfMonth,
              })
            : getDefaultDueDate();

        const dueDatePeriod = getBillingPeriod(dueDate);
        await tx.invoice.update({
          where: { id: latestUnpaidInvoice.id },
          data: {
            studentId: parsed.data.studentId,
            invoiceType:
              billingType === BillingType.MONTHLY
                ? InvoiceType.MONTHLY
                : InvoiceType.ONE_TIME,
            billingYear: dueDatePeriod.billingYear,
            billingMonth: dueDatePeriod.billingMonth,
            originalAmount,
            discount,
            finalAmount,
            dueDate,
            status: resolveInvoiceStatus(
              finalAmount,
              latestUnpaidInvoice.paidAmount,
            ),
          },
        });
      }
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to update enrollment.";
    return { status: "error", message };
  }

  revalidateLocalizedPath("/school/enrollments");
  revalidateLocalizedPath("/school/attendance");
  revalidateLocalizedPath("/school/sections");
  revalidateLocalizedPath("/school/students");
  revalidateLocalizedPath("/school/invoices");
  revalidateLocalizedPath("/school/payments");
  revalidateLocalizedPath("/school/analytics");
  return { status: "success", message: "Enrollment details updated." };
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

  revalidateLocalizedPath("/school/attendance");
  revalidateLocalizedPath("/school/enrollments");
  revalidateLocalizedPath("/school/analytics");
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
    status?: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
    q?: string;
    dateFrom?: Date;
    dateTo?: Date;
    date?: Date;
  };
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const where: Record<string, unknown> = {
    schoolId,
    ...(filters?.enrollmentId ? { enrollmentId: filters.enrollmentId } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.date ? { date: filters.date } : {}),
    ...(filters?.dateFrom || filters?.dateTo
      ? {
          date: {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {}),
          },
        }
      : {}),
    ...(filters?.sectionId || filters?.studentId
      ? {
          enrollment: {
            ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
            ...(filters.studentId ? { studentId: filters.studentId } : {}),
          },
        }
      : {}),
  };

  if (filters?.q) {
    where.OR = [
      { enrollment: { student: { name: containsInsensitive(filters.q) } } },
      { enrollment: { section: { name: containsInsensitive(filters.q) } } },
      {
        enrollment: {
          section: { class: { name: containsInsensitive(filters.q) } },
        },
      },
    ];
  }

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
    remark: emptyToNull(raw.remark as string | undefined),
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

  revalidateLocalizedPath("/school/enrollments");
  return { status: "success", message: "Progress updated." };
}
