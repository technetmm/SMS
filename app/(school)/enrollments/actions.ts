"use server";

import { getServerAuth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  EnrollmentStatus,
  PaymentStatus,
  Permission,
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
import { requirePermission, requireTenant } from "@/lib/rbac";

export type EnrollmentActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const ENROLLMENT_ALLOWED_ROLES = new Set<UserRole>([
  UserRole.SCHOOL_ADMIN,
  UserRole.STAFF,
  UserRole.SUPER_ADMIN,
]);

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

function calculateDiscountAmount({
  originalAmount,
  discountType,
  discountValue,
}: {
  originalAmount: Prisma.Decimal;
  discountType: "NONE" | "FIXED" | "PERCENT";
  discountValue: number;
}) {
  if (discountType === "NONE" || discountValue <= 0) {
    return new Prisma.Decimal(0);
  }

  const rawDiscount =
    discountType === "PERCENT"
      ? originalAmount.mul(discountValue).div(100)
      : new Prisma.Decimal(discountValue);

  if (rawDiscount.greaterThan(originalAmount)) {
    throw new Error("Discount cannot exceed the student fee.");
  }

  return rawDiscount;
}

async function requireEnrollmentActor() {
  const session = await getServerAuth();
  if (!session?.user?.id || !session.user.tenantId) {
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
    tenantId: session.user.tenantId,
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

  const tenantId = actor.tenantId;
  const raw = formDataToObject(formData);
  const parsed = enrollmentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const student = await prisma.student.findFirst({
    where: { id: parsed.data.studentId, tenantId },
    select: { id: true },
  });

  if (!student) {
    return { status: "error", message: "Selected student is invalid." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const sectionRows = await tx.$queryRaw<Array<{ capacity: number; fee: string }>>`
        SELECT s."capacity", c."fee"
        FROM "Section" s
        INNER JOIN "Class" c ON c."id" = s."classId"
        WHERE s."id" = ${parsed.data.sectionId}
          AND s."tenantId" = ${tenantId}
          AND s."isDeleted" = false
        FOR UPDATE
      `;

      const section = sectionRows[0];
      if (!section) {
        throw new Error("Selected section is invalid.");
      }

      const duplicate = await tx.enrollment.findFirst({
        where: {
          tenantId,
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
          tenantId,
          sectionId: parsed.data.sectionId,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      if (enrolledCount >= section.capacity) {
        throw new Error("Section is full.");
      }

      const originalAmount = new Prisma.Decimal(section.fee).div(section.capacity);
      const discount = calculateDiscountAmount({
        originalAmount,
        discountType: parsed.data.discountType,
        discountValue: parsed.data.discountValue,
      });
      const finalAmount = originalAmount.sub(discount);

      const enrollment = await tx.enrollment.create({
        data: {
          tenantId,
          studentId: parsed.data.studentId,
          sectionId: parsed.data.sectionId,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      await tx.invoice.create({
        data: {
          tenantId,
          studentId: parsed.data.studentId,
          enrollmentId: enrollment.id,
          originalAmount,
          discount,
          finalAmount,
          paidAmount: new Prisma.Decimal(0),
          status: PaymentStatus.UNPAID,
          dueDate: getDefaultDueDate(),
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

  revalidatePath("/enrollments");
  revalidatePath("/attendance");
  revalidatePath("/students");
  revalidatePath("/payments");
  revalidatePath("/sections");
  return { status: "success", message: "Student enrolled and invoice created." };
}

export async function getEnrollments(filters?: {
  sectionId?: string;
  studentId?: string;
  date?: Date;
}) {
  await requirePermission(Permission.MANAGE_CLASSES);
  const tenantId = await requireTenant();

  return prisma.enrollment.findMany({
    where: {
      tenantId,
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
      section: {
        select: {
          id: true,
          name: true,
          class: {
            select: {
              name: true,
              fee: true,
            },
          },
        },
      },
      invoices: {
        select: {
          id: true,
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

export async function getEnrollmentFormOptions() {
  const actor = await requireEnrollmentActor();
  if (!actor.ok) {
    return { students: [], sections: [] };
  }

  const tenantId = actor.tenantId;
  const [students, sections, activeEnrollmentCounts] = await Promise.all([
    prisma.student.findMany({
      where: { tenantId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.section.findMany({
      where: { tenantId },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        capacity: true,
        class: { select: { name: true, fee: true } },
      },
    }),
    prisma.enrollment.groupBy({
      by: ["sectionId"],
      where: { tenantId, status: EnrollmentStatus.ACTIVE },
      _count: { _all: true },
    }),
  ]);

  const enrolledMap = new Map(
    activeEnrollmentCounts.map((item) => [item.sectionId, item._count._all]),
  );

  return {
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
      };
    }),
  };
}

export async function updateEnrollment(
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  await requirePermission(Permission.MANAGE_STUDENTS);
  const tenantId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = enrollmentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const existing = await prisma.enrollment.findFirst({
    where: { id: parsed.data.id, tenantId },
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

  revalidatePath("/enrollments");
  revalidatePath("/sections");
  return { status: "success", message: "Enrollment updated." };
}

export async function markAttendance(
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  await requirePermission(Permission.MANAGE_CLASSES);
  const tenantId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = enrollmentAttendanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: parsed.data.enrollmentId, tenantId },
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
        tenantId,
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

  revalidatePath("/attendance");
  revalidatePath("/enrollments");
  revalidatePath("/analytics");
  return { status: "success", message: "Attendance saved." };
}

export async function getAttendanceRecords(filters?: {
  enrollmentId?: string;
  sectionId?: string;
  studentId?: string;
  date?: Date;
}) {
  await requirePermission(Permission.MANAGE_CLASSES);
  const tenantId = await requireTenant();

  return prisma.attendance.findMany({
    where: {
      tenantId,
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

export async function updateProgress(
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  await requirePermission(Permission.MANAGE_CLASSES);
  const tenantId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = enrollmentProgressSchema.safeParse({
    ...raw,
    remark: emptyToUndefined(raw.remark as string | undefined),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: parsed.data.enrollmentId, tenantId },
    select: { id: true },
  });

  if (!enrollment) {
    return { status: "error", message: "Selected enrollment is invalid." };
  }

  try {
    await prisma.progress.upsert({
      where: { enrollmentId: parsed.data.enrollmentId },
      create: {
        tenantId,
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

  revalidatePath("/enrollments");
  return { status: "success", message: "Progress updated." };
}
