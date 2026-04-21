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
import { getLocale, getTranslations } from "next-intl/server";

export async function PayrollTable({
  page,
  filters,
  searchParams,
}: {
  page: number;
  filters?: PayrollTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("SchoolEntities.payroll.table"),
  ]);
  const rows = await getPaginatedPayrolls({ page, filters });
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
  });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.month")}</TableHead>
            <TableHead>{t("columns.staff")}</TableHead>
            <TableHead className="text-right">{t("columns.sections")}</TableHead>
            <TableHead className="text-right">{t("columns.total")}</TableHead>
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
                {t("empty")}
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
