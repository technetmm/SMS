import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale, useTranslations } from "next-intl";
import { dateFormatter } from "@/lib/formatter";

type AttendanceRow = {
  id: string;
  date: Date;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  enrollment: {
    student: { name: string };
    section: { name: string; class: { name: string } };
  };
};

export function EnrollmentAttendanceTable({
  rows,
  pathname,
  searchParams,
}: {
  rows: {
    items: AttendanceRow[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  pathname: string;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const locale = useLocale();
  const t = useTranslations("SchoolEntities.attendance.table");

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.date")}</TableHead>
            <TableHead>{t("columns.student")}</TableHead>
            <TableHead>{t("columns.section")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{dateFormatter(locale).format(row.date)}</TableCell>
              <TableCell className="font-medium">
                {row.enrollment.student.name}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span>{row.enrollment.section.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.enrollment.section.class.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {t(`statusOptions.${row.status.toLowerCase()}`)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {rows.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
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
        pathname={pathname}
        searchParams={searchParams}
      />
    </div>
  );
}
