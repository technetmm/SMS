import { getServerAuth } from "@/auth";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma/client";
import { enqueueAuditLog } from "@/lib/queue";

type LogInput = {
  action: string;
  entity: string;
  entityId?: string | null;
  tenantId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logAction(input: LogInput) {
  const session = await getServerAuth();
  const userId = input.userId ?? session?.user?.id ?? null;
  const tenantId = input.tenantId ?? session?.user?.tenantId ?? null;

  try {
    const queued = await enqueueAuditLog({
      userId,
      tenantId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null,
    });

    if (!queued) {
      await prisma.auditLog.create({
        data: {
          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? null,
          tenantId,
          userId,
          metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
    }
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}
