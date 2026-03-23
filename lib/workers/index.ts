import "dotenv/config";
import { auditWorker } from "./audit.worker";
import { emailWorker } from "./email.worker";

console.log("[workers] audit and email workers started");

async function shutdown() {
  console.log("[workers] shutting down...");
  await Promise.all([auditWorker.close(), emailWorker.close()]);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
