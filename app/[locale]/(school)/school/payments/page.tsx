import { PageHeader } from "@/components/shared/page-header";
import { requireSchoolAdmin } from "@/lib/permissions";
import { ExportMenu } from "@/components/shared/export-menu";
import { exportPaymentsToPDF } from "@/app/(school)/school/exports/actions";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma/client";
import { requireTenantId } from "@/lib/tenant";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/formatter";
import { paginateQuery, parsePageParam } from "@/lib/pagination";
import {
  parseDateRangeParams,
  parseNumberParam,
  parseTableFilterEnumParam,
  parseTextParam,
} from "@/lib/table-filters";
import { PaymentStatus } from "@/app/generated/prisma/enums";
import { PaymentsFilters } from "@/components/payments/payments-filters";
import { dateFormatter } from "@/lib/formatter";
import { getLocale, getTranslations } from "next-intl/server";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    dueFrom?: string;
    dueTo?: string;
    totalMin?: string;
    totalMax?: string;
  }>;
}) {
  await requireSchoolAdmin();
  const schoolId = await requireTenantId();
  const params = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("SchoolEntities.payments.list");
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const status = parseTableFilterEnumParam(params.status, [
    PaymentStatus.UNPAID,
    PaymentStatus.PARTIAL,
    PaymentStatus.PAID,
  ] as const);
  const { from: dueFrom, to: dueTo } = parseDateRangeParams({
    from: params.dueFrom,
    to: params.dueTo,
  });
  const totalMin = parseNumberParam(params.totalMin);
  const totalMax = parseNumberParam(params.totalMax);
  const where: Record<string, unknown> = { schoolId };

  if (status) where.status = status;
  if (dueFrom || dueTo) {
    where.dueDate = {
      ...(dueFrom ? { gte: dueFrom } : {}),
      ...(dueTo ? { lte: dueTo } : {}),
    };
  }
  if (totalMin != null || totalMax != null) {
    where.finalAmount = {
      ...(totalMin != null ? { gte: totalMin } : {}),
      ...(totalMax != null ? { lte: totalMax } : {}),
    };
  }
  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { student: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const invoices = await paginateQuery({
    page,
    count: () => prisma.invoice.count({ where }),
    query: ({ skip, take }) =>
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          finalAmount: true,
          paidAmount: true,
          status: true,
          dueDate: true,
          tenant: { select: { currency: true } },
          student: { select: { name: true } },
        },
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <ExportMenu
            items={[{ label: t("exportPdf"), action: exportPaymentsToPDF }]}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentsFilters
            q={q}
            status={status}
            dueFrom={params.dueFrom}
            dueTo={params.dueTo}
            totalMin={params.totalMin}
            totalMax={params.totalMax}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("table.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.columns.invoice")}</TableHead>
                <TableHead>{t("table.columns.student")}</TableHead>
                <TableHead>{t("table.columns.finalAmount")}</TableHead>
                <TableHead>{t("table.columns.paid")}</TableHead>
                <TableHead>{t("table.columns.dueDate")}</TableHead>
                <TableHead>{t("table.columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.items.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.student.name}</TableCell>
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
                    {dateFormatter(locale).format(invoice.dueDate)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === "PAID" ? "default" : "outline"
                      }
                    >
                      {t(
                        `table.statusOptions.${invoice.status === "UNPAID" ? "unpaid" : invoice.status === "PARTIAL" ? "partial" : "paid"}`,
                      )}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.totalCount === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
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
            pathname="/school/payments"
            searchParams={{
              q: params.q,
              status: params.status,
              dueFrom: params.dueFrom,
              dueTo: params.dueTo,
              totalMin: params.totalMin,
              totalMax: params.totalMax,
              page: params.page,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
