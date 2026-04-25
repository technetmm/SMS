"use client";

import { DayOfWeek } from "@/app/generated/prisma/enums";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimetableTimeRange } from "@/lib/formatter";
import {
  getTimetableDayBackgroundClass,
  getTimetableSlotBackgroundClass,
  getTimetableSlotState,
} from "@/lib/teacher-timetable-highlight";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useTimetableNowContext } from "@/hooks/use-timetable-now-context";

type TimetableSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string | null;
  section: {
    id: string;
    name: string;
    class: { name: string };
  };
};

const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function TeacherDashboardTimetableGrid({
  slots,
  timeZone,
}: {
  slots: TimetableSlot[];
  timeZone?: string;
}) {
  const t = useTranslations("TeacherSite.dashboard.timetable");
  const timetableT = useTranslations("SchoolEntities.timetable.table");
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
    return timetableT(`days.${key}`);
  };

  const byDay = new Map<DayOfWeek, TimetableSlot[]>(
    DAYS.map((day) => [
      day,
      slots
        .filter((slot) => slot.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    ]),
  );
  const nowContext = useTimetableNowContext(timeZone);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/teacher/timetable">{t("viewFullTimetable")}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {slots.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-237.5 grid-cols-7 gap-3 lg:min-w-0">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className={
                    nowContext
                      ? getTimetableDayBackgroundClass(day, nowContext)
                      : "rounded-md border bg-muted/40 p-2"
                  }
                >
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    {dayLabel(day)}
                  </div>
                  <div className="space-y-2">
                    {(byDay.get(day) ?? []).length === 0 ? (
                      <div className="rounded-md border border-dashed bg-background/60 p-2 text-center text-[11px] text-muted-foreground">
                        {t("noSlots")}
                      </div>
                    ) : (
                      (byDay.get(day) ?? []).map((slot) => {
                        const slotState = nowContext
                          ? getTimetableSlotState(slot, nowContext)
                          : "default";
                        return (
                          <Link
                            key={slot.id}
                            href={`/teacher/sections/${slot.section.id}`}
                            className={cn(
                              "block rounded-md border bg-background p-2 text-xs shadow-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              getTimetableSlotBackgroundClass(slotState),
                            )}
                          >
                            <div className="font-medium">
                              {formatTimetableTimeRange(
                                slot.startTime,
                                slot.endTime,
                                locale,
                              )}
                            </div>
                            <div className="mt-1 text-muted-foreground">
                              {slot.section.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {slot.section.class.name}
                            </div>
                            {slot.room ? (
                              <Badge className="mt-2" variant="outline">
                                {slot.room}
                              </Badge>
                            ) : null}
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
