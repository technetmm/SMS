import { forbidden, unauthorized } from "next/navigation";
import { getServerAuth } from "@/auth";
import { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";

async function getSessionUser() {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    unauthorized();
  }
  return session.user;
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

export async function requireSchoolAdminAccess() {
  const user = await getSessionUser();
  if (
    user.role !== UserRole.SCHOOL_SUPER_ADMIN &&
    user.role !== UserRole.SCHOOL_ADMIN &&
    user.role !== UserRole.SUPER_ADMIN
  ) {
    forbidden();
  }
  return user;
}

export async function requireSuperAdminAccess() {
  const user = await getSessionUser();
  if (user.role !== UserRole.SUPER_ADMIN) {
    forbidden();
  }
  return user;
}

export async function requireSchoolOwnerAdminAccess() {
  const user = await getSessionUser();
  if (
    (user.role !== UserRole.SCHOOL_SUPER_ADMIN &&
      user.role !== UserRole.SCHOOL_ADMIN) ||
    !user.schoolId
  ) {
    forbidden();
  }

  const ownerState = await prisma.user.findFirst({
    where: {
      id: user.id,
      schoolId: user.schoolId,
      role: { in: [UserRole.SCHOOL_SUPER_ADMIN, UserRole.SCHOOL_ADMIN] },
    },
    select: { isSchoolOwner: true },
  });

  if (!ownerState?.isSchoolOwner) {
    forbidden();
  }

  return user;
}
