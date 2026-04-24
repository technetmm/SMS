import {
  getPaginatedStaffAttendance,
  type StaffAttendanceTableFilters,
} from "@/app/(school)/school/staff-attendance/actions";
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
import { getLocale, getTranslations } from "next-intl/server";

export async function StaffAttendanceTable({
  page,
  filters,
  searchParams,
}: {
  page: number;
  filters?: StaffAttendanceTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("SchoolEntities.staffAttendance.table"),
  ]);
  const logs = await getPaginatedStaffAttendance({ page, filters });
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.date")}</TableHead>
            <TableHead>{t("columns.staff")}</TableHead>
            <TableHead>{t("columns.section")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.items.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{formatter.format(log.date)}</TableCell>
              <TableCell>{log.staff.name}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span>{log.section.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {log.section.class.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {t(`statusOptions.${log.status.toLowerCase()}`)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {logs.totalCount === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                {t("empty")}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <TablePagination
        pagination={logs}
        pathname="/school/staff-attendance"
        searchParams={searchParams}
      />
    </div>
  );
}
