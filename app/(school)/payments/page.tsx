import { PageHeader } from "@/components/shared/page-header";
import { requireSchoolStaff } from "@/lib/permissions";
import { ExportMenu } from "@/components/shared/export-menu";
import { exportPaymentsToPDF } from "@/app/(school)/exports/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma/client";
import { requireTenantId } from "@/lib/tenant";
import { enumLabel, PAYMENT_STATUS_LABELS } from "@/lib/enum-labels";
import { Badge } from "@/components/ui/badge";

export default async function PaymentsPage() {
  await requireSchoolStaff();
  const schoolId = await requireTenantId();

  const invoices = await prisma.invoice.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      finalAmount: true,
      paidAmount: true,
      status: true,
      dueDate: true,
      student: { select: { name: true } },
    },
  });
  const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track monthly fees, deposits, and invoice status."
        actions={
          <ExportMenu
            items={[
              { label: "Export PDF", action: exportPaymentsToPDF },
            ]}
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
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.student.name}</TableCell>
                  <TableCell>${Number(invoice.finalAmount).toFixed(2)}</TableCell>
                  <TableCell>${Number(invoice.paidAmount).toFixed(2)}</TableCell>
                  <TableCell>{formatter.format(invoice.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === "PAID" ? "default" : "outline"}>
                      {enumLabel(invoice.status, PAYMENT_STATUS_LABELS)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No invoices yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
