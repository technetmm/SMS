import {
  getPaginatedPayrolls,
  type PayrollTableFilters,
} from "@/app/(school)/school/payroll/actions";
import { TablePagination } from "@/components/shared/table-pagination";
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

export async function PayrollTable({
  page,
  filters,
  searchParams,
}: {
  page: number;
  filters?: PayrollTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const rows = await getPaginatedPayrolls({ page, filters });
  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
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
          {rows.items.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                {monthFormatter.format(row.month)}
              </TableCell>
              <TableCell>{row.staff.name}</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline">{row.totalSections}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatMoney(Number(row.totalAmount), row.tenant.currency)}
              </TableCell>
            </TableRow>
          ))}
          {rows.totalCount === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                No payroll generated yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <TablePagination
        pagination={rows}
        pathname="/school/payroll"
        searchParams={searchParams}
      />
    </div>
  );
}

