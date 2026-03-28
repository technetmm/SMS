"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { getServerAuth } from "@/auth";
import { logAction } from "@/lib/audit-log";

export type RoleActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  roleId?: string;
};

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function requireSchoolAdminContext() {
  const session = await getServerAuth();
  if (
    !session?.user?.id ||
    (session.user.role !== UserRole.SCHOOL_ADMIN &&
      session.user.role !== UserRole.SUPER_ADMIN)
  ) {
    return null;
  }
  if (!session.user.schoolId) {
    return null;
  }
  return { userId: session.user.id, schoolId: session.user.schoolId };
}

const createRoleSchema = z.object({
  name: z.string().trim().min(2, "Role name is required"),
});

const updateRoleSchema = z.object({
  roleId: z.string().min(1, "Role is required"),
  name: z.string().trim().min(2, "Role name is required"),
});

const deleteRoleSchema = z.object({
  roleId: z.string().min(1, "Role is required"),
});

const assignRoleToUserSchema = z.object({
  userId: z.string().min(1, "User is required"),
  roleId: z.string().min(1, "Role is required"),
});

const removeRoleFromUserSchema = z.object({
  userId: z.string().min(1, "User is required"),
  roleId: z.string().min(1, "Role is required"),
});

export async function createRole(
  _prevState: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const ctx = await requireSchoolAdminContext();
  if (!ctx) return { status: "error", message: "Unauthorized." };

  const parsed = createRoleSchema.safeParse({
    name: getFormValue(formData, "name"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.errors[0]?.message };

  const exists = await prisma.role.findFirst({
    where: { schoolId: ctx.schoolId, name: parsed.data.name },
    select: { id: true },
  });
  if (exists) return { status: "error", message: "Role name already exists." };

  const created = await prisma.role.create({
    data: {
      schoolId: ctx.schoolId,
      name: parsed.data.name,
      isSystem: false,
    },
  });

  await logAction({
    action: "CREATE",
    entity: "Role",
    entityId: created.id,
    schoolId: ctx.schoolId,
    userId: ctx.userId,
    metadata: { name: created.name },
  });

  revalidatePath("/settings/roles");
  return { status: "success", message: "Role created.", roleId: created.id };
}

export async function updateRole(
  _prevState: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const ctx = await requireSchoolAdminContext();
  if (!ctx) return { status: "error", message: "Unauthorized." };

  const parsed = updateRoleSchema.safeParse({
    roleId: getFormValue(formData, "roleId"),
    name: getFormValue(formData, "name"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.errors[0]?.message };

  const role = await prisma.role.findFirst({
    where: { id: parsed.data.roleId, schoolId: ctx.schoolId },
    select: { id: true, isSystem: true },
  });
  if (!role) return { status: "error", message: "Role not found." };

  const duplicate = await prisma.role.findFirst({
    where: {
      schoolId: ctx.schoolId,
      name: parsed.data.name,
      id: { not: role.id },
    },
    select: { id: true },
  });
  if (duplicate) return { status: "error", message: "Role name already exists." };

  await prisma.role.update({
    where: { id: role.id },
    data: { name: parsed.data.name },
  });

  await logAction({
    action: "UPDATE",
    entity: "Role",
    entityId: role.id,
    schoolId: ctx.schoolId,
    userId: ctx.userId,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/settings/roles");
  revalidatePath(`/settings/roles/${role.id}/edit`);
  return { status: "success", message: "Role updated." };
}

export async function deleteRole(formData: FormData) {
  const ctx = await requireSchoolAdminContext();
  if (!ctx) throw new Error("Unauthorized.");

  const parsed = deleteRoleSchema.safeParse({
    roleId: getFormValue(formData, "roleId"),
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Invalid role.");

  const role = await prisma.role.findFirst({
    where: { id: parsed.data.roleId, schoolId: ctx.schoolId },
    select: { id: true, isSystem: true },
  });
  if (!role) throw new Error("Role not found.");
  if (role.isSystem) throw new Error("System roles cannot be deleted.");

  await prisma.$transaction(async (tx) => {
    await tx.userRoleAssignment.deleteMany({ where: { roleId: role.id } });
    await tx.role.delete({ where: { id: role.id } });
  });

  await logAction({
    action: "DELETE",
    entity: "Role",
    entityId: role.id,
    schoolId: ctx.schoolId,
    userId: ctx.userId,
  });

  revalidatePath("/settings/roles");
}

export async function assignRoleToUser(
  _prevState: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const ctx = await requireSchoolAdminContext();
  if (!ctx) return { status: "error", message: "Unauthorized." };

  const parsed = assignRoleToUserSchema.safeParse({
    userId: getFormValue(formData, "userId"),
    roleId: getFormValue(formData, "roleId"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.errors[0]?.message };

  const [targetUser, role] = await Promise.all([
    prisma.user.findFirst({
      where: { id: parsed.data.userId, schoolId: ctx.schoolId },
      select: { id: true, role: true },
    }),
    prisma.role.findFirst({
      where: { id: parsed.data.roleId, schoolId: ctx.schoolId },
      select: { id: true },
    }),
  ]);

  if (!targetUser) return { status: "error", message: "User not found." };
  if (!role) return { status: "error", message: "Role not found." };
  if (targetUser.role === UserRole.SUPER_ADMIN) {
    return { status: "error", message: "Cannot modify SUPER_ADMIN." };
  }

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: targetUser.id, roleId: role.id } },
    update: {},
    create: { userId: targetUser.id, roleId: role.id },
  });

  await logAction({
    action: "UPDATE",
    entity: "UserRoleAssignment",
    schoolId: ctx.schoolId,
    userId: ctx.userId,
    metadata: { targetUserId: targetUser.id, roleId: role.id, operation: "assign" },
  });

  revalidatePath(`/staff/${targetUser.id}/roles`);
  return { status: "success", message: "Role assigned." };
}

export async function removeRoleFromUser(
  _prevState: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const ctx = await requireSchoolAdminContext();
  if (!ctx) return { status: "error", message: "Unauthorized." };

  const parsed = removeRoleFromUserSchema.safeParse({
    userId: getFormValue(formData, "userId"),
    roleId: getFormValue(formData, "roleId"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.errors[0]?.message };

  const targetUser = await prisma.user.findFirst({
    where: { id: parsed.data.userId, schoolId: ctx.schoolId },
    select: { id: true, role: true },
  });
  if (!targetUser) return { status: "error", message: "User not found." };
  if (targetUser.role === UserRole.SUPER_ADMIN) {
    return { status: "error", message: "Cannot modify SUPER_ADMIN." };
  }

  await prisma.userRoleAssignment.deleteMany({
    where: { userId: targetUser.id, roleId: parsed.data.roleId },
  });

  await logAction({
    action: "UPDATE",
    entity: "UserRoleAssignment",
    schoolId: ctx.schoolId,
    userId: ctx.userId,
    metadata: { targetUserId: targetUser.id, roleId: parsed.data.roleId, operation: "remove" },
  });

  revalidatePath(`/staff/${targetUser.id}/roles`);
  return { status: "success", message: "Role removed." };
}
