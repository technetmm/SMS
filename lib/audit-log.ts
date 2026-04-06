import { getServerAuth } from "@/auth";
import { processAuditLogJob } from "@/lib/jobs/audit-log.job";

type LogInput = {
  action: string;
  entity: string;
  entityId?: string | null;
  schoolId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logAction(input: LogInput) {
  const session = await getServerAuth();
  const userId = input.userId ?? session?.user?.id ?? null;
  const schoolId = input.schoolId ?? session?.user?.schoolId ?? null;

  try {
    await processAuditLogJob({
      userId,
      schoolId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}
