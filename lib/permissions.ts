import { getServerAuth } from "@/auth";
import { UserRole } from "@/app/generated/prisma";
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
