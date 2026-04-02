import { generateMonthlyInvoicesForCurrentPeriod } from "../jobs/monthly-invoice.job";

const BILLING_INTERVAL_MS = 60 * 60 * 1000;

let billingInterval: NodeJS.Timeout | null = null;
let running = false;

async function runBillingCycle() {
  if (running) return;
  running = true;
  try {
    const result = await generateMonthlyInvoicesForCurrentPeriod();
    console.log(
      `[billing-worker] cycle complete ${result.period.billingYear}-${String(
        result.period.billingMonth,
      ).padStart(2, "0")} created=${result.created} skipped=${result.skipped}`,
    );
  } catch (error) {
    console.error("[billing-worker] cycle failed", error);
  } finally {
    running = false;
  }
}

export function startBillingWorker() {
  if (billingInterval) return;
  void runBillingCycle();
  billingInterval = setInterval(() => {
    void runBillingCycle();
  }, BILLING_INTERVAL_MS);
}

export function stopBillingWorker() {
  if (!billingInterval) return;
  clearInterval(billingInterval);
  billingInterval = null;
}
