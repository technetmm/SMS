import { DayOfWeek } from "@/app/generated/prisma/enums";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";

export async function TeacherTimetableTable({
  rows,
  searchParams,
}: {
  rows: {
    items: Array<{
      id: string;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      room: string | null;
      section: { id: string; name: string; class: { name: string } };
    }>;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations("SchoolEntities.timetable.table");

  const dayLabel = (day: DayOfWeek) => {
    const key = day.toLowerCase() as
      | "mon"
      | "tue"
      | "wed"
      | "thu"
      | "fri"
      | "sat"
      | "sun";
    return t(`days.${key}`);
  };

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.day")}</TableHead>
            <TableHead>{t("columns.time")}</TableHead>
            <TableHead>{t("columns.section")}</TableHead>
            <TableHead>{t("columns.room")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.items.map((slot) => (
            <TableRow key={slot.id}>
              <TableCell>{dayLabel(slot.dayOfWeek)}</TableCell>
              <TableCell className="font-medium">
                {slot.startTime} - {slot.endTime}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span>{slot.section.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {slot.section.class.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {slot.room ? <Badge variant="outline">{slot.room}</Badge> : "-"}
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
        pathname="/teacher/timetable"
        searchParams={searchParams}
      />
    </div>
  );
}
