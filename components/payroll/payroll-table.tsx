import { getPayrolls } from "@/app/(school)/school/payroll/actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export async function PayrollTable() {
  const rows = await getPayrolls();
  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
  });
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "MMK",
    maximumFractionDigits: 2,
  });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead className="text-right">Sections</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                {monthFormatter.format(row.month)}
              </TableCell>
              <TableCell>{row.staff.name}</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline">{row.totalSections}</Badge>
              </TableCell>
              <TableCell className="text-right">{money.format(Number(row.totalAmount))}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                No payroll generated yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

