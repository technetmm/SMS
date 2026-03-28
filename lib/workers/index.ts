import "dotenv/config";
import { auditWorker } from "./audit.worker";
import { emailWorker } from "./email.worker";
import { startBillingWorker, stopBillingWorker } from "./billing.worker";

startBillingWorker();
console.log("[workers] audit, email, and billing workers started");

async function shutdown() {
  console.log("[workers] shutting down...");
  stopBillingWorker();
  await Promise.all([auditWorker.close(), emailWorker.close()]);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
