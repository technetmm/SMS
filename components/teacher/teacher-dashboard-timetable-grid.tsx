import { DayOfWeek } from "@/app/generated/prisma/enums";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

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

export async function TeacherDashboardTimetableGrid({
  slots,
}: {
  slots: TimetableSlot[];
}) {
  const [t, timetableT] = await Promise.all([
    getTranslations("TeacherSite.dashboard.timetable"),
    getTranslations("SchoolEntities.timetable.table"),
  ]);

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
            <div className="grid min-w-[950px] grid-cols-7 gap-3 lg:min-w-0">
              {DAYS.map((day) => (
                <div key={day} className="rounded-md border bg-muted/20 p-2">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    {dayLabel(day)}
                  </div>
                  <div className="space-y-2">
                    {(byDay.get(day) ?? []).length === 0 ? (
                      <div className="rounded-md border border-dashed bg-background/60 p-2 text-center text-[11px] text-muted-foreground">
                        {t("noSlots")}
                      </div>
                    ) : (
                      (byDay.get(day) ?? []).map((slot) => (
                        <div key={slot.id} className="rounded-md border bg-background p-2 text-xs shadow-sm">
                          <div className="font-medium">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div className="mt-1 text-muted-foreground">{slot.section.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {slot.section.class.name}
                          </div>
                          {slot.room ? (
                            <Badge className="mt-2" variant="outline">
                              {slot.room}
                            </Badge>
                          ) : null}
                        </div>
                      ))
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
