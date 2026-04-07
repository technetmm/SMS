import { generateMonthlyInvoices } from "@/lib/monthly-invoices";

export async function generateMonthlyInvoicesForCurrentPeriod(now = new Date()) {
  const result = await generateMonthlyInvoices({
    now,
    currentPeriodOnly: true,
    respectCurrentPeriodDueDateGate: true,
  });

  return {
    created: result.created,
    skipped: result.existing + result.gated,
    period: result.period,
  };
}
