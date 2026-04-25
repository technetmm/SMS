"use client";

import { useEffect, useState } from "react";
import { formatTimetableTimeRange } from "@/lib/formatter";
import {
  createTimetableNowContext,
  getTimetableSlotState,
} from "@/lib/teacher-timetable-highlight";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale, useTranslations } from "next-intl";
import { DayOfWeek } from "@/app/generated/prisma/enums";

type Slot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string | null;
  staff: { name: string };
};

export function TeacherSectionActiveTimetableCard({ slots }: { slots: Slot[] }) {
  const t = useTranslations("TeacherSite.sectionDetails");
  const timetableT = useTranslations("SchoolEntities.timetable.table");
  const locale = useLocale();
  const [nowContext, setNowContext] = useState(() =>
    createTimetableNowContext(new Date()),
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowContext(createTimetableNowContext(new Date()));
    }, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

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

  const activeSlot = slots.find(
    (slot) => getTimetableSlotState(slot, nowContext) === "active",
  );
  const upcomingTodaySlot = slots
    .filter((slot) => getTimetableSlotState(slot, nowContext) === "upcoming")
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

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
