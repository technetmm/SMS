"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TableFilterSelect } from "@/components/shared/table-filter-select";
import { Button } from "@/components/ui/button";
import { TABLE_FILTER_ALL_VALUE } from "@/lib/table-filters";
import { DayOfWeek } from "@/app/generated/prisma/enums";
import { useTranslations } from "next-intl";

export function TimetableFilters({
  q,
  dayOfWeek,
}: {
  q?: string;
  dayOfWeek?: DayOfWeek;
}) {
  const t = useTranslations("SchoolEntities.timetable.filters");
  const commonT = useTranslations("Common");

  return (
    <form className="grid gap-4 md:grid-cols-4" method="get">
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="q">{t("search")}</Label>
        <Input
          id="q"
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
        />
      </div>
      <TableFilterSelect
        id="dayOfWeek"
        name="dayOfWeek"
        label={t("day")}
        placeholder={t("allDays")}
        defaultValue={dayOfWeek ?? TABLE_FILTER_ALL_VALUE}
        options={[
          { value: "MON", label: t("days.mon") },
          { value: "TUE", label: t("days.tue") },
          { value: "WED", label: t("days.wed") },
          { value: "THU", label: t("days.thu") },
          { value: "FRI", label: t("days.fri") },
          { value: "SAT", label: t("days.sat") },
          { value: "SUN", label: t("days.sun") },
        ]}
      />
      <div className="flex items-end gap-2">
        <Button type="submit">{commonT("apply")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/timetable")}
        >
          {commonT("reset")}
        </Button>
      </div>
    </form>
  );
}
