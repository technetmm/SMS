import { forbidden, unauthorized } from "next/navigation";
import { getServerAuth } from "@/auth";
import { Permission, UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";

async function getSessionUser() {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    unauthorized();
  }
  return session.user;
}

export async function canAccess(userId: string, permission: Permission) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isDeleted: true },
  });

  if (!user || user.isDeleted) return false;
  if (user.role === UserRole.SUPER_ADMIN) return true;

  const [roleHit, userHit] = await Promise.all([
    prisma.rolePermission.findFirst({
      where: { role: user.role, permission },
      select: { id: true },
    }),
    prisma.userPermission.findFirst({
      where: { userId, permission },
      select: { id: true },
    }),
  ]);

  return Boolean(roleHit || userHit);
}

export async function requireRole(role: UserRole) {
  const user = await getSessionUser();
  if (user.role !== role) {
    forbidden();
  }
  return user;
}

export async function requireTenant() {
  const user = await getSessionUser();
  if (!user.tenantId) {
    forbidden();
  }
  return user.tenantId;
}

export async function requirePermission(permission: Permission) {
  const user = await getSessionUser();

  const allowed = await canAccess(user.id, permission);
  if (!allowed) {
    forbidden();
  }

  return user;
}
