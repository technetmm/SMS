import { DayOfWeek } from "@/app/generated/prisma/enums";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimetableTimeRange } from "@/lib/formatter";
import {
  getTimetableDayBackgroundClass,
  getTimetableSlotBackgroundClass,
  getTimetableSlotState,
} from "@/lib/teacher-timetable-highlight";
import { cn } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";

type TimetableSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string | null;
  staff: { id: string; name: string };
  section: { id: string; name: string; class: { id: string; name: string } };
};
const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export async function ActiveTimetableCard({
  slots,
  staffName,
}: {
  slots: TimetableSlot[];
  staffName?: string;
}) {
  const [t, tableT, boardT, locale] = await Promise.all([
    getTranslations("SchoolEntities.timetable.list"),
    getTranslations("SchoolEntities.timetable.table"),
    getTranslations("SchoolEntities.timetable.board"),
    getLocale(),
  ]);
  const now = new Date();

  const dayLabel = (day: DayOfWeek) => {
    const key = day.toLowerCase() as
      | "mon"
      | "tue"
      | "wed"
      | "thu"
      | "fri"
      | "sat"
      | "sun";
    return tableT(`days.${key}`);
  };

  const activeSlots = slots.filter((slot) => getTimetableSlotState(slot, now) === "active");
  const upcomingToday = slots
    .filter((slot) => getTimetableSlotState(slot, now) === "upcoming")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const byDay = new Map<DayOfWeek, TimetableSlot[]>(
    DAYS.map((day) => [
      day,
      slots
        .filter((slot) => slot.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    ]),
  );

  const nextUpcomingSlots =
    upcomingToday.length === 0
      ? []
      : upcomingToday.filter((slot) => slot.startTime === upcomingToday[0]?.startTime);

  const title = staffName
    ? t("activeTimetable.titleWithStaff", { staff: staffName })
    : t("activeTimetable.title");

  return (
    <Card className="border-emerald-300/80 bg-emerald-50/70 dark:border-emerald-900/70 dark:bg-emerald-950/30">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeSlots.length > 0 ? (
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {t("activeTimetable.liveNow")}
          </p>
        ) : nextUpcomingSlots.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">{t("activeTimetable.noActiveNow")}</p>
            <p className="text-sm font-medium">{t("activeTimetable.nextToday")}</p>
            {nextUpcomingSlots.map((slot) => (
              <p key={slot.id} className="text-sm">
                {dayLabel(slot.dayOfWeek)} •{" "}
                {formatTimetableTimeRange(slot.startTime, slot.endTime, locale)}
              </p>
            ))}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("activeTimetable.noneToday")}</p>
        )}

        {slots.length > 0 ? (
          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-237.5 grid-cols-7 gap-3 lg:min-w-0">
              {DAYS.map((day) => (
                <div key={day} className={getTimetableDayBackgroundClass(day, now)}>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    {dayLabel(day)}
                  </div>
                  <div className="space-y-2">
                    {(byDay.get(day) ?? []).length === 0 ? (
                      <div className="rounded-md border border-dashed bg-background/60 p-2 text-center text-[11px] text-muted-foreground">
                        {boardT("dropHere")}
                      </div>
                    ) : (
                      (byDay.get(day) ?? []).map((slot) => {
                        const slotState = getTimetableSlotState(slot, now);
                        return (
                          <Link
                            key={slot.id}
                            href={`/school/sections/${slot.section.id}`}
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
                            <div className="text-[11px] text-muted-foreground">
                              {t("activeTimetable.staff")}: {slot.staff.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {t("activeTimetable.room")}: {slot.room ?? "-"}
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
