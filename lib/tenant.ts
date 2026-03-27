import { forbidden } from "next/navigation";
import { requireUser } from "@/lib/permissions";

export async function requireTenantId() {
  const session = await requireUser();
  if (!session.user.schoolId) {
    forbidden();
  }
  return session.user.schoolId;
}
