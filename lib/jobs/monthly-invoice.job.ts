import { BillingType, DiscountType, InvoiceType, PaymentStatus } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma/client";
import {
  buildDueDateForPeriod,
  calculateDiscountAmount,
  getBillingPeriod,
  normalizeBillingDay,
} from "@/lib/billing";

export async function generateMonthlyInvoicesForCurrentPeriod(now = new Date()) {
  const { billingYear, billingMonth } = getBillingPeriod(now);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      billingType: BillingType.MONTHLY,
      monthlyBillingActive: true,
      status: "ACTIVE",
      section: { isDeleted: false, class: { isDeleted: false } },
    },
    select: {
      id: true,
      schoolId: true,
      studentId: true,
      billingDayOfMonth: true,
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
    },
  });

  let created = 0;
  let skipped = 0;

  for (const enrollment of enrollments) {
    const billingDayOfMonth = normalizeBillingDay(
      enrollment.billingDayOfMonth || enrollment.tenant?.billingDayOfMonth,
    );

    const dueDate = buildDueDateForPeriod({
      billingYear,
      billingMonth,
      billingDayOfMonth,
    });

    if (now < dueDate) {
      skipped += 1;
      continue;
    }

    const capacity = Math.max(1, enrollment.section.capacity);
    const originalAmount = new Prisma.Decimal(enrollment.section.class.fee).div(capacity);
    const discount = calculateDiscountAmount({
      originalAmount,
      discountType: enrollment.discountType as DiscountType,
      discountValue: new Prisma.Decimal(enrollment.discountValue),
    });
    const finalAmount = originalAmount.sub(discount);

    await prisma.invoice.upsert({
      where: {
        enrollmentId_billingYear_billingMonth: {
          enrollmentId: enrollment.id,
          billingYear,
          billingMonth,
        },
      },
      update: {},
      create: {
        schoolId: enrollment.schoolId,
        studentId: enrollment.studentId,
        enrollmentId: enrollment.id,
        invoiceType: InvoiceType.MONTHLY,
        billingYear,
        billingMonth,
        originalAmount,
        discount,
        finalAmount,
        paidAmount: new Prisma.Decimal(0),
        status: PaymentStatus.UNPAID,
        dueDate,
      },
    });

    created += 1;
  }

  return { created, skipped, period: { billingYear, billingMonth } };
}
