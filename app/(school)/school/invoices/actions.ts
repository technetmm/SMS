"use server";

import { getServerAuth } from "@/auth";
import { revalidatePath } from "next/cache";
import { PaymentStatus, UserRole } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma/client";
import { emptyToUndefined, formDataToObject } from "@/lib/form-utils";
import {
  enrollmentActorRoleSchema,
  paymentCreateSchema,
  refundCreateSchema,
} from "@/lib/validators";

export type BillingActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function resolveInvoiceStatus(
  finalAmount: Prisma.Decimal,
  paidAmount: Prisma.Decimal,
) {
  if (paidAmount.lessThanOrEqualTo(0)) return PaymentStatus.UNPAID;
  if (paidAmount.greaterThanOrEqualTo(finalAmount)) return PaymentStatus.PAID;
  return PaymentStatus.PARTIAL;
}

async function requireStaffOrAdmin() {
  const session = await getServerAuth();
  if (!session?.user?.id || !session.user.schoolId) {
    return { ok: false as const, message: "Unauthorized." };
  }

  const roleCheck = enrollmentActorRoleSchema.safeParse(session.user.role);
  if (!roleCheck.success) {
    return {
      ok: false as const,
      message: "Only staff/admin can manage payments.",
    };
  }

  return {
    ok: true as const,
    schoolId: session.user.schoolId,
    role: session.user.role,
  };
}

async function requireAdminRefund() {
  const actor = await requireStaffOrAdmin();
  if (!actor.ok) return actor;

  if (
    actor.role !== UserRole.SCHOOL_ADMIN &&
    actor.role !== UserRole.SUPER_ADMIN
  ) {
    return { ok: false as const, message: "Only admin can refund." };
  }

  return actor;
}

export async function getInvoices() {
  const actor = await requireStaffOrAdmin();
  if (!actor.ok) return [];

  return prisma.invoice.findMany({
    where: { schoolId: actor.schoolId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      invoiceType: true,
      billingYear: true,
      billingMonth: true,
      status: true,
      originalAmount: true,
      discount: true,
      finalAmount: true,
      paidAmount: true,
      dueDate: true,
      createdAt: true,
      student: { select: { id: true, name: true } },
      enrollment: {
        select: {
          section: {
            select: {
              id: true,
              name: true,
              class: { select: { name: true } },
            },
          },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          method: true,
          createdAt: true,
          refunds: {
            select: { id: true, amount: true, reason: true, createdAt: true },
          },
        },
      },
    },
  });
}

export async function getInvoiceById(id: string) {
  const actor = await requireStaffOrAdmin();
  if (!actor.ok || !id) return null;

  return prisma.invoice.findFirst({
    where: { id, schoolId: actor.schoolId },
    select: {
      id: true,
      invoiceType: true,
      billingYear: true,
      billingMonth: true,
      status: true,
      originalAmount: true,
      discount: true,
      finalAmount: true,
      paidAmount: true,
      dueDate: true,
      createdAt: true,
      student: { select: { id: true, name: true } },
      enrollment: {
        select: {
          section: {
            select: {
              id: true,
              name: true,
              class: { select: { name: true } },
            },
          },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          method: true,
          createdAt: true,
          refunds: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              amount: true,
              reason: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
}

export async function addPayment(
  _prevState: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const actor = await requireStaffOrAdmin();
  if (!actor.ok) return { status: "error", message: actor.message };

  const raw = formDataToObject(formData);
  const parsed = paymentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: parsed.data.invoiceId, schoolId: actor.schoolId },
        select: {
          id: true,
          finalAmount: true,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found.");
      }

      const amount = new Prisma.Decimal(parsed.data.amount);
      const paymentAgg = await tx.payment.aggregate({
        where: { schoolId: actor.schoolId, invoiceId: invoice.id },
        _sum: { amount: true },
      });

      const refundAgg = await tx.refund.aggregate({
        where: {
          schoolId: actor.schoolId,
          payment: { invoiceId: invoice.id },
        },
        _sum: { amount: true },
      });

      const paidBefore = new Prisma.Decimal(paymentAgg._sum.amount ?? 0).sub(
        new Prisma.Decimal(refundAgg._sum.amount ?? 0),
      );
      const remaining = new Prisma.Decimal(invoice.finalAmount).sub(paidBefore);

      if (amount.greaterThan(remaining)) {
        throw new Error("Payment exceeds remaining balance.");
      }

      await tx.payment.create({
        data: {
          schoolId: actor.schoolId,
          invoiceId: invoice.id,
          amount,
          method: parsed.data.method,
        },
      });

      const paidAfter = paidBefore.add(amount);
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: paidAfter,
          status: resolveInvoiceStatus(
            new Prisma.Decimal(invoice.finalAmount),
            paidAfter,
          ),
        },
      });
    });
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Unable to add payment.",
    };
  }

  revalidatePath("/school/payments");
  revalidatePath("/school/invoices");
  return { status: "success", message: "Payment added." };
}

export async function addRefund(
  _prevState: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const actor = await requireAdminRefund();
  if (!actor.ok) return { status: "error", message: actor.message };

  const raw = formDataToObject(formData);
  const parsed = refundCreateSchema.safeParse({
    ...raw,
    reason: emptyToUndefined(raw.reason as string | undefined),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: parsed.data.paymentId, schoolId: actor.schoolId },
        select: {
          id: true,
          amount: true,
          invoiceId: true,
          invoice: { select: { id: true, finalAmount: true } },
        },
      });

      if (!payment) {
        throw new Error("Payment not found.");
      }

      const refundAmount = new Prisma.Decimal(parsed.data.amount);
      const refundedAgg = await tx.refund.aggregate({
        where: { schoolId: actor.schoolId, paymentId: payment.id },
        _sum: { amount: true },
      });

      const refundedBefore = new Prisma.Decimal(refundedAgg._sum.amount ?? 0);
      const refundable = new Prisma.Decimal(payment.amount).sub(refundedBefore);
      if (refundAmount.greaterThan(refundable)) {
        throw new Error("Refund cannot exceed paid amount for this payment.");
      }

      await tx.refund.create({
        data: {
          schoolId: actor.schoolId,
          paymentId: payment.id,
          amount: refundAmount,
          reason: parsed.data.reason,
        },
      });

      const paymentAgg = await tx.payment.aggregate({
        where: { schoolId: actor.schoolId, invoiceId: payment.invoiceId },
        _sum: { amount: true },
      });
      const refundAgg = await tx.refund.aggregate({
        where: {
          schoolId: actor.schoolId,
          payment: { invoiceId: payment.invoiceId },
        },
        _sum: { amount: true },
      });

      const paidAfterRefund = new Prisma.Decimal(
        paymentAgg._sum.amount ?? 0,
      ).sub(new Prisma.Decimal(refundAgg._sum.amount ?? 0));

      await tx.invoice.update({
        where: { id: payment.invoice.id },
        data: {
          paidAmount: paidAfterRefund,
          status: resolveInvoiceStatus(
            new Prisma.Decimal(payment.invoice.finalAmount),
            paidAfterRefund,
          ),
        },
      });
    });
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Unable to process refund.",
    };
  }

  revalidatePath("/school/payments");
  revalidatePath("/school/invoices");
  return { status: "success", message: "Refund created." };
}

export async function generateInvoicePDF(invoiceId: string) {
  const actor = await requireStaffOrAdmin();
  if (!actor.ok) {
    return { status: "error" as const, message: actor.message };
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, schoolId: actor.schoolId },
    select: { id: true },
  });

  if (!invoice) {
    return { status: "error" as const, message: "Invoice not found." };
  }

  return {
    status: "success" as const,
    url: `/school/invoices/${invoice.id}/pdf`,
  };
}
