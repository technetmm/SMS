import { BillingType, DiscountType, InvoiceType } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";

export const DEFAULT_BILLING_DAY = 5;

export function normalizeBillingDay(day?: number | null) {
  if (!day || Number.isNaN(day)) return DEFAULT_BILLING_DAY;
  return Math.min(28, Math.max(1, Math.trunc(day)));
}

export function getBillingPeriod(date = new Date()) {
  return {
    billingYear: date.getUTCFullYear(),
    billingMonth: date.getUTCMonth() + 1,
  };
}

export function buildDueDateForPeriod({
  billingYear,
  billingMonth,
  billingDayOfMonth,
  minDate,
}: {
  billingYear: number;
  billingMonth: number;
  billingDayOfMonth: number;
  minDate?: Date;
}) {
  const day = normalizeBillingDay(billingDayOfMonth);
  const date = new Date(Date.UTC(billingYear, billingMonth - 1, day, 0, 0, 0, 0));
  if (minDate && date < minDate) {
    return minDate;
  }
  return date;
}

export function calculateDiscountAmount({
  originalAmount,
  discountType,
  discountValue,
}: {
  originalAmount: Prisma.Decimal;
  discountType: DiscountType;
  discountValue: Prisma.Decimal;
}) {
  if (discountType === DiscountType.NONE || discountValue.lessThanOrEqualTo(0)) {
    return new Prisma.Decimal(0);
  }

  const rawDiscount =
    discountType === DiscountType.PERCENT
      ? originalAmount.mul(discountValue).div(100)
      : discountValue;

  if (rawDiscount.greaterThan(originalAmount)) {
    throw new Error("Discount cannot exceed the student fee.");
  }

  return rawDiscount;
}

export function resolveInvoiceType(billingType: BillingType): InvoiceType {
  return billingType === BillingType.MONTHLY ? InvoiceType.MONTHLY : InvoiceType.ONE_TIME;
}
