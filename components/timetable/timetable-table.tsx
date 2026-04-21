import Link from "next/link";
import {
  getPaginatedTimetable,
  getTimetable,
  deleteTimetableSlot,
  type TimetableTableFilters,
} from "@/app/(school)/school/timetable/actions";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DayOfWeek } from "@/app/generated/prisma/enums";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTranslations } from "next-intl/server";

export async function TimetableTable({
  page,
  filters,
  searchParams,
  slots: slotsProp,
}: {
  page?: number;
  filters?: TimetableTableFilters;
  searchParams?: Record<string, string | string[] | undefined>;
  slots?: Awaited<ReturnType<typeof getTimetable>>;
} = {}) {
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
  const slots =
    slotsProp != null
      ? {
          items: slotsProp,
          page: 1,
          pageSize: slotsProp.length,
          totalCount: slotsProp.length,
          totalPages: 1,
        }
      : await getPaginatedTimetable({ page: page ?? 1, filters });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.day")}</TableHead>
            <TableHead>{t("columns.time")}</TableHead>
            <TableHead>{t("columns.staff")}</TableHead>
            <TableHead>{t("columns.section")}</TableHead>
            <TableHead>{t("columns.room")}</TableHead>
            <TableHead className="text-right">{t("columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slots.items.map((slot) => (
            <TableRow key={slot.id}>
              <TableCell>
                {dayLabel(slot.dayOfWeek)}
              </TableCell>
              <TableCell className="font-medium">
                {slot.startTime} - {slot.endTime}
              </TableCell>
              <TableCell>{slot.staff.name}</TableCell>
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
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/school/timetable/${slot.id}/edit`}>
                      {t("actions.edit")}
                    </Link>
                  </Button>
                  <form action={deleteTimetableSlot}>
                    <input type="hidden" name="id" value={slot.id} />
                    <Button size="sm" type="submit" variant="destructive">
                      {t("actions.delete")}
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {slots.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {t("empty")}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      {slotsProp == null ? (
        <TablePagination
          pagination={slots}
          pathname="/school/timetable"
          searchParams={searchParams}
        />
      ) : null}
    </div>
  );
}
