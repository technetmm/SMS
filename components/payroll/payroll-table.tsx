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
import { formatMoney } from "@/lib/formatter";
import { getLocale, getTranslations } from "next-intl/server";
import { PayrollAdjustmentButton } from "./payroll-adjustment-form";

export async function PayrollTable({
  page,
  filters,
  searchParams,
}: {
  page: number;
  filters?: PayrollTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [locale, t, commonT] = await Promise.all([
    getLocale(),
    getTranslations("SchoolEntities.payroll.table"),
    getTranslations("Common"),
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
            <TableHead className="text-right">{t("columns.hours")}</TableHead>
            <TableHead className="text-right">{t("columns.total")}</TableHead>
            <TableHead className="text-right">
              {t("columns.adjustment")}
            </TableHead>
            <TableHead>{t("columns.reason")}</TableHead>
            <TableHead className="text-right">{commonT("actions")}</TableHead>
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
                <Badge variant="outline">{row.totalHours}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatMoney(Number(row.totalAmount), row.tenant.currency)}
              </TableCell>
              <TableCell className="text-right">
                {row.adjustments && row.adjustments.length > 0 ? (
                  <Badge variant="outline">
                    {formatMoney(
                      Number(row.adjustments[0].adjustmentAmount),
                      row.tenant.currency,
                    )}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {row.adjustments &&
                row.adjustments.length > 0 &&
                row.adjustments[0].adjustmentReason ? (
                  <span
                    className="text-sm"
                    title={row.adjustments[0].adjustmentReason}
                  >
                    {row.adjustments[0].adjustmentReason.length > 20
                      ? `${row.adjustments[0].adjustmentReason.substring(0, 20)}...`
                      : row.adjustments[0].adjustmentReason}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <PayrollAdjustmentButton
                  payroll={{
                    id: row.id,
                    staffName: row.staff.name,
                    month: row.month,
                    totalHours: row.totalHours,
                    totalAmount: Number(row.totalAmount),
                    originalAmount: Number(row.totalAmount),
                    currency: row.tenant.currency,
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
          {rows.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-sm text-muted-foreground"
              >
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
