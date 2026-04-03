import { type ConnectionOptions, Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL;
const connection: ConnectionOptions | null = redisUrl
  ? { url: redisUrl }
  : null;

let auditLogQueue: Queue | null = null;
let emailQueue: Queue | null = null;

function getAuditLogQueue() {
  if (!connection) return null;
  if (!auditLogQueue) {
    auditLogQueue = new Queue("audit-log", { connection });
  }
  return auditLogQueue;
}

function getEmailQueue() {
  if (!connection) return null;
  if (!emailQueue) {
    emailQueue = new Queue("email", { connection });
  }
  return emailQueue;
}

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
  const queue = getAuditLogQueue();
  if (!queue) return false;

  try {
    await queue.add("log", payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 1000,
    });
    return true;
  } catch (error) {
    console.error("enqueueAuditLog failed", {
      error: error instanceof Error ? error.message : "Unknown queue error",
    });
    return false;
  }
}

export async function enqueueEmail(payload: {
  to: string;
  subject: string;
  body?: string;
  textBody?: string;
  htmlBody?: string;
  delayMs?: number;
}) {
  const queue = getEmailQueue();
  if (!queue) return false;

  const legacyBody = payload.body?.trim();
  const textBody = payload.textBody?.trim() || legacyBody;
  const htmlBody =
    payload.htmlBody?.trim() ||
    (legacyBody ? textToSimpleHtml(legacyBody) : undefined);

  if (!textBody && !htmlBody) {
    throw new Error("Email payload requires body, textBody, or htmlBody.");
  }

  try {
    await queue.add(
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
  } catch (error) {
    console.error("enqueueEmail failed", {
      error: error instanceof Error ? error.message : "Unknown queue error",
    });
    return false;
  }
}
