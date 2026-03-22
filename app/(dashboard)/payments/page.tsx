import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const invoices = [
  { id: "INV-1024", student: "Myo Min", amount: 120, status: "Paid" },
  { id: "INV-1025", student: "Aye Aye", amount: 140, status: "Unpaid" },
  { id: "INV-1026", student: "Kyaw Thu", amount: 90, status: "Paid" },
];

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track monthly fees, deposits, and invoice status."
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
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.student}</TableCell>
                  <TableCell>${invoice.amount}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
