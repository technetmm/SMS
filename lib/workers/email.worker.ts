import { type ConnectionOptions, Worker } from "bullmq";
import { processEmailJob } from "../jobs/email.job";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL is required to run email worker.");
}

const connection: ConnectionOptions = { url: redisUrl };

export const emailWorker = new Worker(
  "email",
  async (job) => {
    await processEmailJob(job.data);
  },
  {
    connection,
    concurrency: 5,
  },
);

emailWorker.on("completed", (job) => {
  console.log(`[email-worker] completed ${job.id}`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`[email-worker] failed ${job?.id}`, error);
});
