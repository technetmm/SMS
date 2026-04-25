"use client";

import { DayOfWeek } from "@/app/generated/prisma/enums";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTimetableTimeRange } from "@/lib/formatter";
import {
  getTimetableSlotRemainingMinutes,
  getTimetableSlotStartsInMinutes,
  getTimetableDayBackgroundClass,
  getTimetableSlotBackgroundClass,
  isTimetableSlotStartingSoon,
  getTimetableSlotState,
  isTimetableSlotEndingSoon,
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
  const boardT = useTranslations("SchoolEntities.timetable.board");
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
    return boardT(`days.${key}`);
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
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium">{t("title")}</h3>
          <p className="text-xs text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className="text-[11px]">
            {boardT("activeDay", { day: dayLabel(nowContext?.dayOfWeek ?? "MON") })}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href="/teacher/timetable">{t("viewFullTimetable")}</Link>
          </Button>
        </div>
      </div>
      <div>
        {slots.length === 0 ? (
          <p className="rounded-md border border-dashed bg-background/60 p-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-7">
            {DAYS.map((day) => (
              <div
                key={day}
                className={
                  nowContext
                    ? getTimetableDayBackgroundClass(day, nowContext)
                    : "rounded-md border bg-muted/40 p-2"
                }
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div
                    className={cn(
                      "text-xs font-medium text-muted-foreground",
                      nowContext?.dayOfWeek === day && "text-foreground",
                    )}
                  >
                    {dayLabel(day)}
                  </div>
                  {nowContext?.dayOfWeek === day ? (
                    <span
                      className="size-2 rounded-full bg-emerald-500"
                      aria-label={boardT("activeDay", { day: dayLabel(day) })}
                      title={boardT("activeDay", { day: dayLabel(day) })}
                    />
                  ) : null}
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
                      const isEndingSoon = nowContext
                        ? isTimetableSlotEndingSoon(slot, nowContext)
                        : false;
                      const remainingMinutes =
                        nowContext && isEndingSoon
                          ? getTimetableSlotRemainingMinutes(slot, nowContext)
                          : null;
                      const isStartingSoon = nowContext
                        ? isTimetableSlotStartingSoon(slot, nowContext)
                        : false;
                      const startsInMinutes =
                        nowContext && isStartingSoon
                          ? getTimetableSlotStartsInMinutes(slot, nowContext)
                          : null;
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
                          <div className="mt-1 text-muted-foreground">{slot.section.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {slot.section.class.name}
                          </div>
                          {remainingMinutes != null ? (
                            <Badge
                              className="mt-2 border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              variant="outline"
                            >
                              {t("endingSoon", { minutes: remainingMinutes })}
                            </Badge>
                          ) : null}
                          {startsInMinutes != null ? (
                            <Badge
                              className="mt-2 border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                              variant="outline"
                            >
                              {t("startingSoon", { minutes: startsInMinutes })}
                            </Badge>
                          ) : null}
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
        )}
      </div>
    </div>
  );
}
