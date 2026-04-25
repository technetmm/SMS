"use client";

import { formatTimetableTimeRange } from "@/lib/formatter";
import {
  getTimetableSlotRemainingMinutes,
  getTimetableSlotState,
  isTimetableSlotEndingSoon,
} from "@/lib/teacher-timetable-highlight";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale, useTranslations } from "next-intl";
import { DayOfWeek } from "@/app/generated/prisma/enums";
import { useTimetableNowContext } from "@/hooks/use-timetable-now-context";

type Slot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string | null;
  staff: { name: string };
};

export function TeacherSectionActiveTimetableCard({
  slots,
  timeZone,
}: {
  slots: Slot[];
  timeZone?: string;
}) {
  const t = useTranslations("TeacherSite.sectionDetails");
  const timetableT = useTranslations("SchoolEntities.timetable.table");
  const locale = useLocale();
  const nowContext = useTimetableNowContext(timeZone);

  const dayLabel = (day: string) => {
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

  const activeSlot = nowContext
    ? slots.find((slot) => getTimetableSlotState(slot, nowContext) === "active")
    : undefined;
  const activeRemainingMinutes =
    activeSlot && nowContext ? getTimetableSlotRemainingMinutes(activeSlot, nowContext) : null;
  const activeIsEndingSoon =
    activeSlot && nowContext ? isTimetableSlotEndingSoon(activeSlot, nowContext) : false;
  const upcomingTodaySlot = nowContext
    ? slots
        .filter((slot) => getTimetableSlotState(slot, nowContext) === "upcoming")
        .sort((a, b) => a.startTime.localeCompare(b.startTime))[0]
    : undefined;

  return (
    <Card className="border-emerald-300/80 bg-emerald-50/70 dark:border-emerald-900/70 dark:bg-emerald-950/30">
      <CardHeader>
        <CardTitle>{t("activeTimetable.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeSlot ? (
          <>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {t("activeTimetable.liveNow")}
            </p>
            {activeIsEndingSoon && activeRemainingMinutes != null ? (
              <Badge
                className="w-fit border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                variant="outline"
              >
                {t("activeTimetable.endingSoon", { minutes: activeRemainingMinutes })}
              </Badge>
            ) : null}
            <p className="text-sm">
              <span className="font-medium">{dayLabel(activeSlot.dayOfWeek)}</span>{" "}
              •{" "}
              {formatTimetableTimeRange(
                activeSlot.startTime,
                activeSlot.endTime,
                locale,
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("activeTimetable.teacher")}: {activeSlot.staff.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("activeTimetable.room")}: {activeSlot.room ?? t("notAvailable")}
            </p>
          </>
        ) : upcomingTodaySlot ? (
          <>
            <p className="text-sm text-muted-foreground">
              {t("activeTimetable.noActive")}
            </p>
            <p className="text-sm">
              <span className="font-medium">{t("activeTimetable.startsAt")}</span>{" "}
              {formatTimetableTimeRange(
                upcomingTodaySlot.startTime,
                upcomingTodaySlot.endTime,
                locale,
              )}{" "}
              ({dayLabel(upcomingTodaySlot.dayOfWeek)})
            </p>
            <p className="text-sm text-muted-foreground">
              {t("activeTimetable.teacher")}: {upcomingTodaySlot.staff.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("activeTimetable.room")}: {upcomingTodaySlot.room ?? t("notAvailable")}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("activeTimetable.noMoreToday")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
