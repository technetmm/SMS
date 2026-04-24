"use client";

import { useEffect, useState } from "react";
import { DayOfWeek } from "@/app/generated/prisma/enums";
import { ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
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
import { formatTimetableTimeRange } from "@/lib/formatter";
import {
  createTimetableNowContext,
  getTimetableSlotBackgroundClass,
  getTimetableSlotState,
} from "@/lib/teacher-timetable-highlight";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

export function TeacherTimetableTable({
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
      section: {
        id: string;
        name: string;
        meetingLink: string | null;
        class: { name: string };
      };
    }>;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const t = useTranslations("SchoolEntities.timetable.table");
  const locale = useLocale();

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
  const [nowContext, setNowContext] = useState(() =>
    createTimetableNowContext(new Date()),
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowContext(createTimetableNowContext(new Date()));
    }, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.day")}</TableHead>
            <TableHead>{t("columns.time")}</TableHead>
            <TableHead>{t("columns.section")}</TableHead>
            <TableHead>{t("columns.meetingLink")}</TableHead>
            <TableHead>{t("columns.room")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.items.map((slot) => (
            <TableRow
              key={slot.id}
              className={cn(
                getTimetableSlotBackgroundClass(getTimetableSlotState(slot, nowContext)),
              )}
            >
              <TableCell>{dayLabel(slot.dayOfWeek)}</TableCell>
              <TableCell className="font-medium">
                {formatTimetableTimeRange(slot.startTime, slot.endTime, locale)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/teacher/sections/${slot.section.id}`}
                    className="hover:underline"
                  >
                    {slot.section.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {slot.section.class.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {slot.section.meetingLink ? (
                  <a
                    href={slot.section.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("actions.openMeeting")}
                    title={t("actions.openMeeting")}
                    className="inline-flex size-8 items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                {slot.room ? <Badge variant="outline">{slot.room}</Badge> : "-"}
              </TableCell>
            </TableRow>
          ))}
          {rows.totalCount === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
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
