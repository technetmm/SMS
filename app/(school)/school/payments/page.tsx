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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  parseDateRangeParams,
  parseEnumParam,
  parseNumberParam,
  parseTextParam,
} from "@/lib/table-filters";
import { PaymentStatus } from "@/app/generated/prisma/enums";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const status = parseEnumParam(params.status, [
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
          <form className="mb-4 grid gap-4 md:grid-cols-4" method="get">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Invoice id or student"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={status}>
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
              <Label htmlFor="totalMin">Total Min</Label>
              <Input
                id="totalMin"
                name="totalMin"
                type="number"
                step="0.01"
                defaultValue={params.totalMin}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="totalMax">Total Max</Label>
              <Input
                id="totalMax"
                name="totalMax"
                type="number"
                step="0.01"
                defaultValue={params.totalMax}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/school/payments">Reset</Link>
              </Button>
            </div>
          </form>
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
                  <TableCell>{formatter.format(invoice.dueDate)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === "PAID" ? "default" : "outline"
                      }
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
