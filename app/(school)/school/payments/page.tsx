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
import { enumLabel, PAYMENT_STATUS_LABELS } from "@/lib/enum-labels";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/helper";
import { paginateQuery, parsePageParam } from "@/lib/pagination";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireSchoolAdmin();
  const schoolId = await requireTenantId();
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const invoices = await paginateQuery({
    page,
    count: () => prisma.invoice.count({ where: { schoolId } }),
    query: ({ skip, take }) =>
      prisma.invoice.findMany({
        where: { schoolId },
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
  const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track monthly fees, deposits, and invoice status."
        actions={
          <ExportMenu
            items={[{ label: "Export PDF", action: exportPaymentsToPDF }]}
          />
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Final Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.items.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.student.name}</TableCell>
                  <TableCell>
                    {formatMoney(Number(invoice.finalAmount), invoice.tenant.currency)}
                  </TableCell>
                  <TableCell>
                    {formatMoney(Number(invoice.paidAmount), invoice.tenant.currency)}
                  </TableCell>
                  <TableCell>{formatter.format(invoice.dueDate)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={invoice.status === "PAID" ? "default" : "outline"}
                    >
                      {enumLabel(invoice.status, PAYMENT_STATUS_LABELS)}
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
                    No invoices yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <TablePagination pagination={invoices} pathname="/school/payments" />
        </CardContent>
      </Card>
    </div>
  );
}
