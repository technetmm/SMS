import { type ConnectionOptions, Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL;
const connection: ConnectionOptions | null = redisUrl ? { url: redisUrl } : null;

export const auditLogQueue = connection
  ? new Queue("audit-log", { connection })
  : null;

export const emailQueue = connection
  ? new Queue("email", { connection })
  : null;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function textToSimpleHtml(text: string) {
  return `<pre style="font-family:inherit;white-space:pre-wrap;">${escapeHtml(text)}</pre>`;
}

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
  body?: string;
  textBody?: string;
  htmlBody?: string;
  delayMs?: number;
}) {
  if (!emailQueue) return false;

  const legacyBody = payload.body?.trim();
  const textBody = payload.textBody?.trim() || legacyBody;
  const htmlBody = payload.htmlBody?.trim() || (legacyBody ? textToSimpleHtml(legacyBody) : undefined);

  if (!textBody && !htmlBody) {
    throw new Error("Email payload requires body, textBody, or htmlBody.");
  }

  await emailQueue.add(
    "sendEmail",
    {
      to: payload.to,
      subject: payload.subject,
      body: legacyBody,
      textBody,
      htmlBody,
    },
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
