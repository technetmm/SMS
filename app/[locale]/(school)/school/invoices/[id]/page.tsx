import Link from "next/link";
import { redirect } from "next/navigation";
import { getInvoiceById } from "@/app/(school)/school/invoices/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  enumLabel,
  INVOICE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/enum-labels";
import { formatMoney } from "@/lib/formatter";
import { InvoicePaymentForm } from "@/components/invoices/invoice-payment-form";
import { InvoiceRefundForm } from "@/components/invoices/invoice-refund-form";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    redirect("/school/invoices");
  }

  const remaining = Math.max(
    0,
    Number(invoice.finalAmount) - Number(invoice.paidAmount),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.id.slice(0, 8)}`}
        description="Billing breakdown, payment history, refunds, and PDF export."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/school/invoices">Back</Link>
            </Button>
            <Button asChild>
              <Link href={`/school/invoices/${invoice.id}/pdf`}>
                Download Invoice
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Original Fee</CardTitle>
          </CardHeader>
          <CardContent>
            {formatMoney(
              Number(invoice.originalAmount),
              invoice.tenant.currency,
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Discount</CardTitle>
          </CardHeader>
          <CardContent>
            {formatMoney(Number(invoice.discount), invoice.tenant.currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Final Fee</CardTitle>
          </CardHeader>
          <CardContent>
            {formatMoney(Number(invoice.finalAmount), invoice.tenant.currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paid / Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            {formatMoney(Number(invoice.paidAmount), invoice.tenant.currency)} /{" "}
            {formatMoney(remaining, invoice.tenant.currency)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Student:</strong> {invoice.student.name}
          </p>
          <p>
            <strong>Section:</strong> {invoice.enrollment.section.class.name} /{" "}
            {invoice.enrollment.section.name}
          </p>
          <p>
            <strong>Type:</strong>{" "}
            {enumLabel(invoice.invoiceType, INVOICE_TYPE_LABELS)}
          </p>
          <p>
            <strong>Billing Period:</strong>{" "}
            {invoice.billingYear && invoice.billingMonth
              ? `${invoice.billingYear}-${String(invoice.billingMonth).padStart(2, "0")}`
              : "-"}
          </p>
          <p>
            <strong>Currency:</strong> {invoice.tenant.currency}
          </p>
          <div>
            <strong>Status:</strong>{" "}
            <Badge variant={invoice.status === "PAID" ? "default" : "outline"}>
              {enumLabel(invoice.status, PAYMENT_STATUS_LABELS)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicePaymentForm
            invoiceId={invoice.id}
            currency={invoice.tenant.currency}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Refund (Admin Only)</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceRefundForm
            currency={invoice.tenant.currency}
            payments={invoice.payments.map((payment) => ({
              id: payment.id,
              amount: payment.amount.toString(),
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice.payments.map((payment) => (
            <div key={payment.id} className="rounded-md border p-3 text-sm">
              <p>
                <strong>{payment.method}</strong> /{" "}
                {formatMoney(Number(payment.amount), invoice.tenant.currency)} /{" "}
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(payment.createdAt)}
              </p>
              {payment.refunds.length ? (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {payment.refunds.map((refund) => (
                    <p key={refund.id}>
                      Refund:{" "}
                      {formatMoney(
                        Number(refund.amount),
                        invoice.tenant.currency,
                      )}{" "}
                      / {refund.reason ?? "No reason"}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
