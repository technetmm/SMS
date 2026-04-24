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
import { formatMoney } from "@/lib/helper";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  parseDateRangeParams,
  parseNumberParam,
  parseTableFilterEnumParam,
  parseTextParam,
} from "@/lib/table-filters";
import { InvoiceType, PaymentStatus } from "@/app/generated/prisma/enums";
import { InvoicesFilters } from "@/components/invoices/invoice-filters";
import { InvoicePaidAllForm } from "@/components/invoices/invoice-paid-all-form";
import { getTranslations } from "next-intl/server";

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
  const status = parseTableFilterEnumParam(params.status, [
    PaymentStatus.UNPAID,
    PaymentStatus.PARTIAL,
    PaymentStatus.PAID,
  ] as const);
  const invoiceType = parseTableFilterEnumParam(params.invoiceType, [
    InvoiceType.ONE_TIME,
    InvoiceType.MONTHLY,
  ] as const);
  const { from: dueFrom, to: dueTo } = parseDateRangeParams({
    from: params.dueFrom,
    to: params.dueTo,
  });
  const finalMin = parseNumberParam(params.finalMin);
  const finalMax = parseNumberParam(params.finalMax);
  const t = await getTranslations("SchoolEntities.invoices.list");

  const invoices = await getPaginatedInvoices({
    page,
    filters: { q, status, invoiceType, dueFrom, dueTo, finalMin, finalMax },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <InvoicePaidAllForm
              q={params.q}
              status={params.status}
              invoiceType={params.invoiceType}
              dueFrom={params.dueFrom}
              dueTo={params.dueTo}
              finalMin={params.finalMin}
              finalMax={params.finalMax}
              disabled={invoices.totalCount === 0}
            />
            <InvoiceGenerateForm />
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicesFilters
            q={q}
            status={status}
            invoiceType={invoiceType}
            dueFrom={params.dueFrom}
            dueTo={params.dueTo}
            finalMin={finalMin}
            finalMax={finalMax}
          />
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.columns.invoice")}</TableHead>
              <TableHead>{t("table.columns.student")}</TableHead>
              <TableHead>{t("table.columns.section")}</TableHead>
              <TableHead>{t("table.columns.type")}</TableHead>
              <TableHead>{t("table.columns.period")}</TableHead>
              <TableHead>{t("table.columns.finalAmount")}</TableHead>
              <TableHead>{t("table.columns.paid")}</TableHead>
              <TableHead>{t("table.columns.remaining")}</TableHead>
              <TableHead>{t("table.columns.status")}</TableHead>
              <TableHead className="text-right">
                {t("table.columns.actions")}
              </TableHead>
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
                    {t(
                      `table.invoiceTypeOptions.${invoice.invoiceType === "ONE_TIME" ? "oneTime" : "monthly"}`,
                    )}
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
                      {t(
                        `table.statusOptions.${invoice.status === "UNPAID" ? "unpaid" : invoice.status === "PARTIAL" ? "partial" : "paid"}`,
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/school/invoices/${invoice.id}`}>
                          {t("table.actions.view")}
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/school/invoices/${invoice.id}/pdf`}>
                          {t("table.actions.downloadPdf")}
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
                  {t("table.empty")}
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
