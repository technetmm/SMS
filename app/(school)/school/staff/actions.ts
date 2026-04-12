"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { formDataToObject, emptyToUndefined } from "@/lib/form-utils";
import { staffCreateSchema, staffUpdateSchema } from "@/lib/validators";
import { UserRole } from "@/app/generated/prisma/enums";
import { processEmailJob } from "@/lib/jobs/email.job";
import { logAction } from "@/lib/audit-log";
import { paginateQuery } from "@/lib/pagination";
import { getServerAuth } from "@/auth";
import { z } from "zod";
import { containsInsensitive } from "@/lib/table-filters";

export type StaffActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type StaffTableFilters = {
  q?: string;
  role?: "SCHOOL_ADMIN" | "TEACHER";
  status?: "ACTIVE" | "ONLEAVE" | "RESIGNED" | "TERMINATED";
  hireFrom?: Date;
  hireTo?: Date;
};

export type StaffSystemRoleActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  shouldLogout?: boolean;
  redirectTo?: string;
};

const setStaffSystemRoleSchema = z.object({
  targetUserId: z.string().min(1, "User is required."),
  nextRole: z
    .nativeEnum(UserRole)
    .refine(
      (role) => role === UserRole.SCHOOL_ADMIN || role === UserRole.TEACHER,
      "Invalid target role.",
    ),
});

export async function createStaff(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = staffCreateSchema.safeParse({
    ...raw,
    parmentAddress: emptyToUndefined(raw.parmentAddress),
    currentAddress: emptyToUndefined(raw.currentAddress),
    phone: emptyToUndefined(raw.phone),
    remark: emptyToUndefined(raw.remark),
    exitDate: emptyToUndefined(raw.exitDate),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing) {
    return { status: "error", message: "Email already exists." };
  }

  try {
    let createdStaffId = "";
    await prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(parsed.data.password, 10);

      const user = await tx.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
          role: UserRole.TEACHER,
          passwordHash,
          schoolId,
        },
      });

      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          schoolId,
          name: parsed.data.name,
          jobTitle: parsed.data.jobTitle,
          nrcNumber: parsed.data.nrcNumber,
          dob: parsed.data.dob,
          email: parsed.data.email,
          gender: parsed.data.gender,
          maritalStatus: parsed.data.maritalStatus,
          parmentAddress: parsed.data.parmentAddress,
          currentAddress: parsed.data.currentAddress,
          phone: parsed.data.phone,
          hireDate: parsed.data.hireDate,
          exitDate: parsed.data.exitDate,
          status: parsed.data.status,
          remark: parsed.data.remark,
          ratePerSection: parsed.data.ratePerSection,
        },
      });
      createdStaffId = staff.id;
    });

    try {
      await processEmailJob({
        to: parsed.data.email,
        subject: "Welcome to Technet SMS",
        body: `Hi ${parsed.data.name}, your staff account is ready.`,
      });
    } catch (emailError) {
      console.error("createStaff processEmailJob failed", {
        email: parsed.data.email,
        error: emailError,
      });
    }

    await logAction({
      action: "CREATE",
      entity: "Staff",
      entityId: createdStaffId,
      schoolId,
      metadata: { email: parsed.data.email },
    });
  } catch (error) {
    console.error("createStaff failed", error);
    return { status: "error", message: "Unable to create staff." };
  }

  revalidatePath("/school/staff");
  return { status: "success", message: "Staff created successfully." };
}

export async function getStaff() {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  return prisma.staff.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          role: true,
        },
      },
      name: true,
      email: true,
      phone: true,
      status: true,
      hireDate: true,
    },
  });
}

export async function getPaginatedStaff({
  page,
  filters,
}: {
  page: number;
  filters?: StaffTableFilters;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();
  const where: Record<string, unknown> = { schoolId };

  if (filters?.status) where.status = filters.status;
  if (filters?.role) {
    where.user = { role: filters.role };
  }
  if (filters?.hireFrom || filters?.hireTo) {
    where.hireDate = {
      ...(filters.hireFrom ? { gte: filters.hireFrom } : {}),
      ...(filters.hireTo ? { lte: filters.hireTo } : {}),
    };
  }
  if (filters?.q) {
    where.OR = [
      { name: containsInsensitive(filters.q) },
      { email: containsInsensitive(filters.q) },
      { phone: containsInsensitive(filters.q) },
      { user: { email: containsInsensitive(filters.q) } },
    ];
  }

  return paginateQuery({
    page,
    count: () => prisma.staff.count({ where }),
    query: ({ skip, take }) =>
      prisma.staff.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              role: true,
            },
          },
          name: true,
          email: true,
          phone: true,
          status: true,
          hireDate: true,
        },
      }),
  });
}

export async function updateStaff(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = staffUpdateSchema.safeParse({
    ...raw,
    parmentAddress: emptyToUndefined(raw.parmentAddress),
    currentAddress: emptyToUndefined(raw.currentAddress),
    phone: emptyToUndefined(raw.phone),
    remark: emptyToUndefined(raw.remark),
    exitDate: emptyToUndefined(raw.exitDate),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const staff = await prisma.staff.findFirst({
    where: { id: parsed.data.id, schoolId },
    select: { userId: true },
  });

  if (!staff) {
    return { status: "error", message: "Staff not found." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing && existing.id !== staff.userId) {
    return { status: "error", message: "Email already exists." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: staff.userId },
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
        },
      });

      await tx.staff.update({
        where: { id: parsed.data.id },
        data: {
          schoolId,
          name: parsed.data.name,
          jobTitle: parsed.data.jobTitle,
          nrcNumber: parsed.data.nrcNumber,
          dob: parsed.data.dob,
          email: parsed.data.email,
          gender: parsed.data.gender,
          maritalStatus: parsed.data.maritalStatus,
          parmentAddress: parsed.data.parmentAddress,
          currentAddress: parsed.data.currentAddress,
          phone: parsed.data.phone,
          hireDate: parsed.data.hireDate,
          exitDate: parsed.data.exitDate,
          status: parsed.data.status,
          remark: parsed.data.remark,
          ratePerSection: parsed.data.ratePerSection,
        },
      });
    });
  } catch (error) {
    console.error("updateStaff failed", error);
    return { status: "error", message: "Unable to update staff." };
  }

  revalidatePath("/school/staff");
  return { status: "success", message: "Staff updated successfully." };
}

export async function deleteStaff(formData: FormData) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Staff id is required");
  }

  const staff = await prisma.staff.findFirst({
    where: { id, schoolId },
    select: {
      userId: true,
      _count: { select: { sections: true } },
    },
  });

  if (!staff) {
    throw new Error("Staff not found");
  }

  if (staff._count.sections > 0) {
    throw new Error("Staff is assigned to sections. Remove assignments first.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.staff.delete({ where: { id } });
    await tx.user.delete({ where: { id: staff.userId } });
  });

  revalidatePath("/school/staff");
}

export async function setStaffSystemRole(
  _prevState: StaffSystemRoleActionState,
  formData: FormData,
): Promise<StaffSystemRoleActionState> {
  const session = await getServerAuth();
  if (
    !session?.user?.id ||
    !session.user.schoolId ||
    (session.user.role !== UserRole.SCHOOL_SUPER_ADMIN &&
      session.user.role !== UserRole.SCHOOL_ADMIN)
  ) {
    return { status: "error", message: "Unauthorized." };
  }

  const parsed = setStaffSystemRoleSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    nextRole: formData.get("nextRole"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: parsed.data.targetUserId, schoolId: session.user.schoolId },
    select: {
      id: true,
      role: true,
      staffProfile: { select: { id: true } },
      studentProfile: { select: { id: true } },
    },
  });

  if (!targetUser) {
    return { status: "error", message: "User not found." };
  }
  if (targetUser.role === UserRole.SUPER_ADMIN) {
    return { status: "error", message: "Cannot modify SUPER_ADMIN." };
  }
  if (
    targetUser.role === UserRole.SCHOOL_SUPER_ADMIN ||
    targetUser.role === UserRole.STUDENT
  ) {
    return { status: "error", message: "Target user cannot use staff admin roles." };
  }
  if (!targetUser.staffProfile || targetUser.studentProfile) {
    return { status: "error", message: "Target user is not a staff account." };
  }
  if (targetUser.role === parsed.data.nextRole) {
    return {
      status: "success",
      message: `User is already ${parsed.data.nextRole}.`,
    };
  }

  await prisma.user.update({
    where: { id: targetUser.id },
    data: {
      role: parsed.data.nextRole,
      isSchoolOwner: false,
    },
  });

  await logAction({
    action: "UPDATE",
    entity: "User",
    entityId: targetUser.id,
    schoolId: session.user.schoolId,
    userId: session.user.id,
    metadata: {
      operation: "set_system_role",
      nextRole: parsed.data.nextRole,
    },
  });

  revalidatePath("/school/staff");
  revalidatePath(`/school/staff/${targetUser.staffProfile.id}`);

  const isSelfDemotionToTeacher =
    targetUser.id === session.user.id &&
    parsed.data.nextRole === UserRole.TEACHER;

  if (isSelfDemotionToTeacher) {
    return {
      status: "success",
      message: "Demoted to TEACHER.",
      shouldLogout: true,
      redirectTo: "/login?demoted=1",
    };
  }

  if (parsed.data.nextRole === UserRole.SCHOOL_ADMIN) {
    return {
      status: "success",
      message: "Promoted to SCHOOL_ADMIN.",
    };
  }

  return {
    status: "success",
    message: "Demoted to TEACHER.",
  };
}
