import { forbidden } from "next/navigation";
import { requireUser } from "@/lib/permissions";

export async function requireTenantId() {
  const session = await requireUser();
  if (!session.user.tenantId) {
    forbidden();
  }
  return session.user.tenantId;
}
