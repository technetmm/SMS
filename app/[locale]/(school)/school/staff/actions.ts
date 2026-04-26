"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@/app/generated/prisma/client";
import { revalidateLocalizedPath } from "@/lib/revalidate";
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
  msgID?: number;
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
  msgID?: number;
};

const resetStaffTwoFactorSchema = z.object({
  targetUserId: z.string().min(1, "User is required."),
});

const resetStaffPasswordSchema = z.object({
  targetUserId: z.string().min(1, "User is required."),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm password is required."),
});

function canResetTargetByRole({
  actorRole,
  actorSchoolId,
  targetRole,
  targetSchoolId,
}: {
  actorRole: UserRole;
  actorSchoolId: string | null | undefined;
  targetRole: UserRole;
  targetSchoolId: string | null | undefined;
}) {
  if (actorRole === UserRole.SUPER_ADMIN) {
    return (
      targetRole === UserRole.SCHOOL_SUPER_ADMIN ||
      targetRole === UserRole.SCHOOL_ADMIN ||
      targetRole === UserRole.TEACHER
    );
  }

  if (actorRole === UserRole.SCHOOL_SUPER_ADMIN) {
    return (
      Boolean(actorSchoolId) &&
      actorSchoolId === targetSchoolId &&
      (targetRole === UserRole.SCHOOL_ADMIN || targetRole === UserRole.TEACHER)
    );
  }

  return false;
}

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
    return {
      status: "error",
      message: parsed.error.errors[0]?.message,
      msgID: Date.now(),
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing) {
    return {
      status: "error",
      message: "Email already exists.",
      msgID: Date.now(),
    };
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
          ratePerHour: parsed.data.ratePerHour,
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
    return {
      status: "error",
      message: "Unable to create staff.",
      msgID: Date.now(),
    };
  }

  revalidateLocalizedPath("/school/staff");
  return {
    status: "success",
    message: "Staff created successfully.",
    msgID: Date.now(),
  };
}

export async function getStaff() {
  const sessionUser = await requireSchoolAdminAccess();
  const schoolId = await requireTenant();
  const allowedRoles =
    sessionUser.role === UserRole.SUPER_ADMIN
      ? [UserRole.SCHOOL_SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]
      : [UserRole.SCHOOL_ADMIN, UserRole.TEACHER];

  return prisma.staff.findMany({
    where: {
      schoolId,
      userId: { not: sessionUser.id },
      user: {
        role: { in: allowedRoles },
      },
    },
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
  const sessionUser = await requireSchoolAdminAccess();
  const schoolId = await requireTenant();
  const allowedRoles =
    sessionUser.role === UserRole.SUPER_ADMIN
      ? [UserRole.SCHOOL_SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]
      : [UserRole.SCHOOL_ADMIN, UserRole.TEACHER];
  const where: Record<string, unknown> = {
    schoolId,
    userId: { not: sessionUser.id },
    user: {
      role: { in: allowedRoles },
    },
  };

  if (filters?.status) where.status = filters.status;
  if (filters?.role) {
    where.user = {
      role: filters.role,
    };
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
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message,
      msgID: Date.now(),
    };
  }

  const staff = await prisma.staff.findFirst({
    where: { id: parsed.data.id, schoolId },
    select: { userId: true },
  });

  if (!staff) {
    return {
      status: "error",
      message: "Staff not found.",
      msgID: Date.now(),
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing && existing.id !== staff.userId) {
    return {
      status: "error",
      message: "Email already exists.",
      msgID: Date.now(),
    };
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
          exitDate:
            parsed.data.exitDate === undefined
              ? undefined
              : parsed.data.exitDate,
          status: parsed.data.status,
          remark: parsed.data.remark,
          ratePerHour: parsed.data.ratePerHour,
        },
      });
    });
  } catch (error) {
    console.error("updateStaff failed", error);
    return {
      status: "error",
      message: "Unable to update staff.",
      msgID: Date.now(),
    };
  }

  revalidateLocalizedPath("/school/staff");
  return {
    status: "success",
    message: "Staff updated successfully.",
    msgID: Date.now(),
  };
}

export async function resetStaffTwoFactor(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: "Unauthorized.", msgID: Date.now() };
  }

  const parsed = resetStaffTwoFactorSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message,
      msgID: Date.now(),
    };
  }

  if (parsed.data.targetUserId === session.user.id) {
    return {
      status: "error",
      message: "You cannot reset your own 2FA here.",
      msgID: Date.now(),
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.targetUserId },
    select: { id: true, role: true, schoolId: true },
  });
  if (!targetUser) {
    return {
      status: "error",
      message: "User not found.",
      msgID: Date.now(),
    };
  }

  const allowed = canResetTargetByRole({
    actorRole: session.user.role,
    actorSchoolId: session.user.schoolId,
    targetRole: targetUser.role,
    targetSchoolId: targetUser.schoolId,
  });
  if (!allowed) {
    return {
      status: "error",
      message: "Unauthorized.",
      msgID: Date.now(),
    };
  }

  await prisma.user.update({
    where: { id: targetUser.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  await logAction({
    action: "UPDATE",
    entity: "User",
    entityId: targetUser.id,
    schoolId: targetUser.schoolId ?? undefined,
    userId: session.user.id,
    metadata: {
      field: "twoFactor",
      operation: "reset_two_factor_by_admin",
      actorRole: session.user.role,
      targetRole: targetUser.role,
    },
  });

  revalidateLocalizedPath("/school/staff");
  return {
    status: "success",
    message: "Two-factor authentication has been reset.",
    msgID: Date.now(),
  };
}

export async function resetStaffPassword(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    return { status: "error", message: "Unauthorized.", msgID: Date.now() };
  }

  const parsed = resetStaffPasswordSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message,
      msgID: Date.now(),
    };
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return {
      status: "error",
      message: "Passwords do not match.",
      msgID: Date.now(),
    };
  }

  if (parsed.data.targetUserId === session.user.id) {
    return {
      status: "error",
      message: "Use your own change password page.",
      msgID: Date.now(),
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.targetUserId },
    select: { id: true, role: true, schoolId: true },
  });
  if (!targetUser) {
    return {
      status: "error",
      message: "User not found.",
      msgID: Date.now(),
    };
  }

  const allowed = canResetTargetByRole({
    actorRole: session.user.role,
    actorSchoolId: session.user.schoolId,
    targetRole: targetUser.role,
    targetSchoolId: targetUser.schoolId,
  });
  if (!allowed) {
    return {
      status: "error",
      message: "Unauthorized.",
      msgID: Date.now(),
    };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: targetUser.id },
    data: { passwordHash: newHash },
  });

  await logAction({
    action: "UPDATE",
    entity: "User",
    entityId: targetUser.id,
    schoolId: targetUser.schoolId ?? undefined,
    userId: session.user.id,
    metadata: {
      field: "password",
      operation: "reset_password_by_admin",
      actorRole: session.user.role,
      targetRole: targetUser.role,
    },
  });

  revalidateLocalizedPath("/school/staff");
  return {
    status: "success",
    message: "Password has been reset successfully.",
    msgID: Date.now(),
  };
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
    return {
      status: "error",
      message: "Staff not found.",
      msgID: Date.now(),
    };
  }

  if (staff._count.sections > 0) {
    return {
      status: "error",
      message: "Staff is assigned to sections. Remove assignments first.",
      msgID: Date.now(),
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.staff.delete({ where: { id } });
    await tx.user.delete({ where: { id: staff.userId } });
  });

  revalidateLocalizedPath("/school/staff");
}

const updateStaffHourlyRateSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required."),
  hourlyRate: z.string().min(1, "Hourly rate is required."),
});

export async function updateStaffHourlyRate(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  const raw = formDataToObject(formData);
  const parsed = updateStaffHourlyRateSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message,
      msgID: Date.now(),
    };
  }

  const staff = await prisma.staff.findFirst({
    where: { id: parsed.data.staffId, schoolId },
    select: { id: true, name: true },
  });

  if (!staff) {
    return {
      status: "error",
      message: "Staff not found.",
      msgID: Date.now(),
    };
  }

  try {
    await prisma.staff.update({
      where: { id: parsed.data.staffId },
      data: { ratePerHour: new Prisma.Decimal(parsed.data.hourlyRate) },
    });

    await logAction({
      action: "UPDATE",
      entity: "Staff",
      entityId: staff.id,
      schoolId,
      metadata: {
        field: "hourlyRate",
        newValue: parsed.data.hourlyRate,
      },
    });
  } catch (error) {
    console.error("updateStaffHourlyRate failed", error);
    return {
      status: "error",
      message: "Unable to update hourly rate.",
      msgID: Date.now(),
    };
  }

  revalidateLocalizedPath("/school/staff");
  return {
    status: "success",
    message: "Hourly rate updated successfully.",
    msgID: Date.now(),
  };
}

export async function getStaffWithHourlyRates() {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();

  return prisma.staff.findMany({
    where: { schoolId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      ratePerHour: true,
      status: true,
      tenant: { select: { currency: true } },
    },
  });
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
    return { status: "error", message: "Unauthorized.", msgID: Date.now() };
  }

  const parsed = setStaffSystemRoleSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    nextRole: formData.get("nextRole"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message,
      msgID: Date.now(),
    };
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
    return { status: "error", message: "User not found.", msgID: Date.now() };
  }
  if (targetUser.role === UserRole.SUPER_ADMIN) {
    return {
      status: "error",
      message: "Cannot modify SUPER_ADMIN.",
      msgID: Date.now(),
    };
  }
  if (
    targetUser.role === UserRole.SCHOOL_SUPER_ADMIN ||
    targetUser.role === UserRole.STUDENT
  ) {
    return {
      status: "error",
      message: "Target user cannot use staff admin roles.",
      msgID: Date.now(),
    };
  }
  if (!targetUser.staffProfile || targetUser.studentProfile) {
    return {
      status: "error",
      message: "Target user is not a staff account.",
      msgID: Date.now(),
    };
  }
  const isSchoolAdminDemotion =
    parsed.data.nextRole === UserRole.TEACHER &&
    targetUser.role === UserRole.SCHOOL_ADMIN;
  if (session.user.role === UserRole.SCHOOL_ADMIN && isSchoolAdminDemotion) {
    return {
      status: "error",
      message: "Admin cannot demote admin accounts.",
      msgID: Date.now(),
    };
  }
  if (targetUser.role === parsed.data.nextRole) {
    return {
      status: "success",
      message: `User is already ${parsed.data.nextRole}.`,
      msgID: Date.now(),
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

  revalidateLocalizedPath("/school/staff");
  revalidateLocalizedPath(`/school/staff/${targetUser.staffProfile.id}`);

  const isSelfDemotionToTeacher =
    targetUser.id === session.user.id &&
    parsed.data.nextRole === UserRole.TEACHER;

  if (isSelfDemotionToTeacher) {
    return {
      status: "success",
      message: "Demoted to teacher.",
      shouldLogout: true,
      redirectTo: "/login?demoted=1",
      msgID: Date.now(),
    };
  }

  if (parsed.data.nextRole === UserRole.SCHOOL_ADMIN) {
    return {
      status: "success",
      message: "Promoted to Admin.",
      msgID: Date.now(),
    };
  }

  return {
    status: "success",
    message: "Demoted to Teacher.",
    msgID: Date.now(),
  };
}
