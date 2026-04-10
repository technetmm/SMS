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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseDateRangeParams,
  parseEnumParam,
  parseNumberParam,
  parseTextParam,
} from "@/lib/table-filters";
import { InvoiceType, PaymentStatus } from "@/app/generated/prisma/enums";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    invoiceType?: string;
    dueFrom?: string;
    dueTo?: string;
    finalMin?: string;
    finalMax?: string;
  }>;
}) {
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const status = parseEnumParam(params.status, [
    PaymentStatus.UNPAID,
    PaymentStatus.PARTIAL,
    PaymentStatus.PAID,
  ] as const);
  const invoiceType = parseEnumParam(params.invoiceType, [
    InvoiceType.ONE_TIME,
    InvoiceType.MONTHLY,
  ] as const);
  const { from: dueFrom, to: dueTo } = parseDateRangeParams({
    from: params.dueFrom,
    to: params.dueTo,
  });
  const finalMin = parseNumberParam(params.finalMin);
  const finalMax = parseNumberParam(params.finalMax);

  const invoices = await getPaginatedInvoices({
    page,
    filters: { q, status, invoiceType, dueFrom, dueTo, finalMin, finalMax },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage discounts, partial payments, refunds, and invoice documents."
        actions={<InvoiceGenerateForm />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Invoice, student, class, section"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" value={status}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent position={"popper"}>
                  <SelectGroup>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoiceType">Invoice Type</Label>
              <Select name="invoiceType" value={status}>
                <SelectTrigger id="invoiceType" className="w-full">
                  <SelectValue placeholder="Select invoice type" />
                </SelectTrigger>
                <SelectContent position={"popper"}>
                  <SelectGroup>
                    <SelectItem value="ONE_TIME">One Time</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueFrom">Due From</Label>
              <Input
                id="dueFrom"
                name="dueFrom"
                type="date"
                defaultValue={parseTextParam(params.dueFrom)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueTo">Due To</Label>
              <Input
                id="dueTo"
                name="dueTo"
                type="date"
                defaultValue={parseTextParam(params.dueTo)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="finalMin">Final Min</Label>
              <Input
                id="finalMin"
                name="finalMin"
                type="number"
                step="0.01"
                defaultValue={params.finalMin}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="finalMax">Final Max</Label>
              <Input
                id="finalMax"
                name="finalMax"
                type="number"
                step="0.01"
                defaultValue={params.finalMax}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/school/invoices">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
        <TablePagination
          pagination={invoices}
          pathname="/school/invoices"
          searchParams={{
            q: params.q,
            status: params.status,
            invoiceType: params.invoiceType,
            dueFrom: params.dueFrom,
            dueTo: params.dueTo,
            finalMin: params.finalMin,
            finalMax: params.finalMax,
            page: params.page,
          }}
        />
      </div>
    </div>
  );
}
