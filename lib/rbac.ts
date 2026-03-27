import { forbidden, unauthorized } from "next/navigation";
import { getServerAuth } from "@/auth";
import { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import type { PermissionKey } from "@/lib/permission-keys";

async function getSessionUser() {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    unauthorized();
  }
  return session.user;
}

export async function can(userId: string, permission: PermissionKey | string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      schoolId: true,
      isDeleted: true,
      staffProfile: { select: { id: true } },
      studentProfile: { select: { id: true } },
    },
  });

  if (!user || user.isDeleted) return false;
  if (user.role === UserRole.SUPER_ADMIN) return true;
  if (
    user.role === UserRole.SCHOOL_ADMIN &&
    !user.staffProfile &&
    !user.studentProfile
  ) {
    return true;
  }
  if (!user.schoolId) return false;

  const roleHit = await prisma.userRoleAssignment.findFirst({
    where: {
      userId,
      role: {
        schoolId: user.schoolId,
        permissions: {
          some: {
            permission: { key: permission },
          },
        },
      },
    },
    select: { id: true },
  });

  return Boolean(roleHit);
}

export async function requireRole(role: UserRole) {
  const user = await getSessionUser();
  if (user.role !== role) {
    forbidden();
  }
  return user;
}

export async function requireSchool() {
  const user = await getSessionUser();
  if (!user.schoolId) {
    forbidden();
  }
  return user.schoolId;
}

export async function requireTenant() {
  return requireSchool();
}

export async function requirePermission(permission: PermissionKey | string) {
  const user = await getSessionUser();

  const allowed = await can(user.id, permission);
  if (!allowed) {
    forbidden();
  }

  return user;
}
