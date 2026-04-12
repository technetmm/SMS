import {
  BillingType,
  DiscountType,
  EnrollmentStatus,
  InvoiceType,
  PaymentStatus,
} from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma/client";
import {
  buildDueDateForPeriod,
  calculateDiscountAmount,
  getBillingPeriod,
  normalizeBillingDay,
} from "@/lib/billing";

type BillingPeriod = {
  billingYear: number;
  billingMonth: number;
};

type GenerateMonthlyInvoicesOptions = {
  now?: Date;
  schoolId?: string;
  currentPeriodOnly?: boolean;
  respectCurrentPeriodDueDateGate?: boolean;
};

function comparePeriods(a: BillingPeriod, b: BillingPeriod) {
  if (a.billingYear !== b.billingYear) {
    return a.billingYear - b.billingYear;
  }
  return a.billingMonth - b.billingMonth;
}

function nextPeriod(period: BillingPeriod): BillingPeriod {
  if (period.billingMonth === 12) {
    return { billingYear: period.billingYear + 1, billingMonth: 1 };
  }
  return { billingYear: period.billingYear, billingMonth: period.billingMonth + 1 };
}

function getEnrollmentStartPeriod(enrollment: {
  monthlyStartYear: number | null;
  monthlyStartMonth: number | null;
  enrolledAt: Date;
}) {
  if (enrollment.monthlyStartYear && enrollment.monthlyStartMonth) {
    return {
      billingYear: enrollment.monthlyStartYear,
      billingMonth: enrollment.monthlyStartMonth,
    };
  }

  return getBillingPeriod(enrollment.enrolledAt);
}

export async function generateMonthlyInvoices(options: GenerateMonthlyInvoicesOptions = {}) {
  const now = options.now ?? new Date();
  const currentPeriod = getBillingPeriod(now);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      ...(options.schoolId ? { schoolId: options.schoolId } : {}),
      billingType: BillingType.MONTHLY,
      monthlyBillingActive: true,
      status: EnrollmentStatus.ACTIVE,
      section: { isDeleted: false, class: { isDeleted: false } },
    },
    select: {
      id: true,
      schoolId: true,
      studentId: true,
      billingDayOfMonth: true,
      monthlyStartYear: true,
      monthlyStartMonth: true,
      enrolledAt: true,
      discountType: true,
      discountValue: true,
      section: {
        select: {
          capacity: true,
          class: { select: { fee: true } },
        },
      },
      tenant: {
        select: { billingDayOfMonth: true },
      },
      invoices: {
        where: { invoiceType: InvoiceType.MONTHLY },
        select: {
          billingYear: true,
          billingMonth: true,
        },
      },
    },
  });

  let created = 0;
  let existing = 0;
  let gated = 0;

  for (const enrollment of enrollments) {
    const startPeriod = options.currentPeriodOnly
      ? currentPeriod
      : getEnrollmentStartPeriod(enrollment);

    if (comparePeriods(startPeriod, currentPeriod) > 0) {
      continue;
    }

    const billingDayOfMonth = normalizeBillingDay(
      enrollment.billingDayOfMonth || enrollment.tenant?.billingDayOfMonth,
    );

    const capacity = Math.max(1, enrollment.section.capacity);
    const originalAmount = new Prisma.Decimal(enrollment.section.class.fee).div(capacity);
    const discount = calculateDiscountAmount({
      originalAmount,
      discountType: enrollment.discountType as DiscountType,
      discountValue: new Prisma.Decimal(enrollment.discountValue),
    });
    const finalAmount = originalAmount.sub(discount);

    const existingPeriods = new Set(
      enrollment.invoices
        .filter((invoice) => invoice.billingYear && invoice.billingMonth)
        .map((invoice) => `${invoice.billingYear}-${invoice.billingMonth}`),
    );

    for (
      let period = startPeriod;
      comparePeriods(period, currentPeriod) <= 0;
      period = nextPeriod(period)
    ) {
      const periodKey = `${period.billingYear}-${period.billingMonth}`;
      if (existingPeriods.has(periodKey)) {
        existing += 1;
        continue;
      }

      const dueDate = buildDueDateForPeriod({
        billingYear: period.billingYear,
        billingMonth: period.billingMonth,
        billingDayOfMonth,
      });

      const isCurrentPeriod = comparePeriods(period, currentPeriod) === 0;
      if (
        isCurrentPeriod &&
        options.respectCurrentPeriodDueDateGate &&
        now < dueDate
      ) {
        gated += 1;
        continue;
      }

      await prisma.invoice.create({
        data: {
          schoolId: enrollment.schoolId,
          studentId: enrollment.studentId,
          enrollmentId: enrollment.id,
          invoiceType: InvoiceType.MONTHLY,
          billingYear: period.billingYear,
          billingMonth: period.billingMonth,
          originalAmount,
          discount,
          finalAmount,
          paidAmount: new Prisma.Decimal(0),
          status: PaymentStatus.UNPAID,
          dueDate,
        },
      });

      existingPeriods.add(periodKey);
      created += 1;
    }
  }

  return {
    created,
    existing,
    gated,
    period: currentPeriod,
  };
}
