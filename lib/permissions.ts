import { getServerAuth } from "@/auth";
import { UserRole } from "@/app/generated/prisma/enums";
import { forbidden, unauthorized } from "next/navigation";

export async function requireUser() {
  const session = await getServerAuth();
  if (!session?.user) {
    unauthorized();
  }
  return session;
}

export async function requireRole(roles: UserRole[]) {
  const session = await requireUser();
  if (!roles.includes(session.user.role)) {
    forbidden();
  }
  return session;
}

export async function requireSuperAdmin() {
  return requireRole([UserRole.SUPER_ADMIN]);
}

export async function requireSchoolAdmin() {
  return requireRole([UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN]);
}

export async function requireSchoolStaff() {
  const session = await requireUser();
  if (!session.user.schoolId && session.user.role !== UserRole.SUPER_ADMIN) {
    forbidden();
  }
  return session;
}

export async function requireEnrollmentManager() {
  const session = await requireSchoolStaff();
  return session;
}
