import { type ConnectionOptions, Worker } from "bullmq";
import { processAuditLogJob } from "../jobs/audit-log.job";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL is required to run audit worker.");
}

const connection: ConnectionOptions = { url: redisUrl };

export const auditWorker = new Worker(
  "audit-log",
  async (job) => {
    await processAuditLogJob(job.data);
  },
  {
    connection,
    concurrency: 5,
  },
);

auditWorker.on("completed", (job) => {
  console.log(`[audit-worker] completed ${job.id}`);
});

auditWorker.on("failed", (job, error) => {
  console.error(`[audit-worker] failed ${job?.id}`, error);
});
