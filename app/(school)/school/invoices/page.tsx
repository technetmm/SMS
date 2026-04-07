import Link from "next/link";
import { getPaginatedInvoices } from "@/app/(school)/school/invoices/actions";
import { InvoiceGenerateForm } from "@/components/invoices/invoice-generate-form";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  enumLabel,
  INVOICE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/enum-labels";
import { formatMoney } from "@/lib/helper";
import { parsePageParam } from "@/lib/pagination";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const invoices = await getPaginatedInvoices({ page });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage discounts, partial payments, refunds, and invoice documents."
        actions={<InvoiceGenerateForm />}
      />

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Final Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.items.map((invoice) => {
              const remaining = Math.max(
                0,
                Number(invoice.finalAmount) - Number(invoice.paidAmount),
              );

              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{invoice.student.name}</TableCell>
                  <TableCell>
                    {invoice.enrollment.section.class.name} /{" "}
                    {invoice.enrollment.section.name}
                  </TableCell>
                  <TableCell>
                    {enumLabel(invoice.invoiceType, INVOICE_TYPE_LABELS)}
                  </TableCell>
                  <TableCell>
                    {invoice.billingYear && invoice.billingMonth
                      ? `${invoice.billingYear}-${String(invoice.billingMonth).padStart(2, "0")}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {formatMoney(
                      Number(invoice.finalAmount),
                      invoice.tenant.currency,
                    )}
                  </TableCell>
                  <TableCell>
                    {formatMoney(
                      Number(invoice.paidAmount),
                      invoice.tenant.currency,
                    )}
                  </TableCell>
                  <TableCell>
                    {formatMoney(remaining, invoice.tenant.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === "PAID"
                          ? "default"
                          : invoice.status === "PARTIAL"
                            ? "outline"
                            : "outline"
                      }
                    >
                      {enumLabel(invoice.status, PAYMENT_STATUS_LABELS)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/school/invoices/${invoice.id}`}>
                          View
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/school/invoices/${invoice.id}/pdf`}>
                          Download PDF
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {invoices.totalCount === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No invoices yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePagination pagination={invoices} pathname="/school/invoices" />
      </div>
    </div>
  );
}
