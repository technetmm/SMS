import { type ConnectionOptions, Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL;
const connection: ConnectionOptions | null = redisUrl ? { url: redisUrl } : null;

export const auditLogQueue = connection
  ? new Queue("audit-log", { connection })
  : null;

export const emailQueue = connection
  ? new Queue("email", { connection })
  : null;

export async function enqueueAuditLog(payload: {
  userId?: string | null;
  schoolId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  if (!auditLogQueue) return false;
  await auditLogQueue.add("log", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 1000,
  });
  return true;
}

export async function enqueueEmail(payload: {
  to: string;
  subject: string;
  body: string;
  delayMs?: number;
}) {
  if (!emailQueue) return false;
  await emailQueue.add(
    "sendEmail",
    { to: payload.to, subject: payload.subject, body: payload.body },
    {
      attempts: 3,
      delay: payload.delayMs ?? 0,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 1000,
    },
  );
  return true;
}
