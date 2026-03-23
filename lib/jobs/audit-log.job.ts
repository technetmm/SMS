import { prisma } from "../prisma/client";
import { Prisma } from "../../app/generated/prisma/client";

export async function processAuditLogJob(data: {
  userId?: string | null;
  tenantId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: data.userId ?? null,
      tenantId: data.tenantId ?? null,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId ?? null,
      metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
