import { NextRequest } from "next/server";
import { getServerAuth } from "@/auth";
import { prisma } from "@/lib/prisma/client";
import { buildInvoicePdfBuffer } from "@/lib/export/invoice-pdf";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerAuth();
  if (!session?.user?.schoolId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, schoolId: session.user.schoolId },
    select: {
      id: true,
      createdAt: true,
      originalAmount: true,
      discount: true,
      finalAmount: true,
      paidAmount: true,
      status: true,
      tenant: { select: { name: true, currency: true } },
      student: { select: { name: true } },
      enrollment: {
        select: {
          section: {
            select: {
              name: true,
              class: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    return new Response("Invoice not found", { status: 404 });
  }

  const pdf = await buildInvoicePdfBuffer({
    schoolName: invoice.tenant.name,
    currency: invoice.tenant.currency,
    invoiceId: invoice.id,
    createdAt: invoice.createdAt,
    studentName: invoice.student.name,
    className: invoice.enrollment.section.class.name,
    sectionName: invoice.enrollment.section.name,
    originalAmount: Number(invoice.originalAmount),
    discount: Number(invoice.discount),
    finalAmount: Number(invoice.finalAmount),
    paidAmount: Number(invoice.paidAmount),
    status: invoice.status,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${invoice.id.slice(0, 8)}.pdf`,
      "Cache-Control": "no-store",
    },
  });
}
