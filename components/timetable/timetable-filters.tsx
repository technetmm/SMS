"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TableFilterSelect } from "@/components/shared/table-filter-select";
import { Button } from "@/components/ui/button";
import { TABLE_FILTER_ALL_VALUE } from "@/lib/table-filters";
import { DayOfWeek } from "@/app/generated/prisma/enums";

export function TimetableFilters({
  q,
  dayOfWeek,
}: {
  q?: string;
  dayOfWeek?: DayOfWeek;
}) {
  return (
    <form className="grid gap-4 md:grid-cols-4" method="get">
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Staff, section, class, room"
        />
      </div>
      <TableFilterSelect
        id="dayOfWeek"
        name="dayOfWeek"
        label="Day"
        placeholder="All days"
        defaultValue={dayOfWeek ?? TABLE_FILTER_ALL_VALUE}
        options={[
          { value: "MON", label: "Monday" },
          { value: "TUE", label: "Tuesday" },
          { value: "WED", label: "Wednesday" },
          { value: "THU", label: "Thursday" },
          { value: "FRI", label: "Friday" },
          { value: "SAT", label: "Saturday" },
          { value: "SUN", label: "Sunday" },
        ]}
      />
      <div className="flex items-end gap-2">
        <Button type="submit">Apply</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/timetable")}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
