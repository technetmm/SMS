"use client";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { TableFilterSelect } from "@/components/shared/table-filter-select";
import { Button } from "@/components/ui/button";
import { parseTextParam } from "@/lib/table-filters";

export function StaffAttendanceFilter({
  q,
  status,
  dateFrom,
  dateTo,
}: {
  q?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return (
    <form className="grid gap-4 md:grid-cols-4" method="get">
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Staff, section, class"
        />
      </div>
      <TableFilterSelect
        id="status"
        name="status"
        label="Status"
        placeholder="All statuses"
        defaultValue={status}
        options={[
          { value: "PRESENT", label: "Present" },
          { value: "ABSENT", label: "Absent" },
          { value: "LATE", label: "Late" },
          { value: "LEAVE", label: "Leave" },
        ]}
      />
      <div className="grid gap-2">
        <Label htmlFor="dateFrom">Date From</Label>
        <Input
          id="dateFrom"
          name="dateFrom"
          type="date"
          defaultValue={parseTextParam(dateFrom)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dateTo">Date To</Label>
        <Input
          id="dateTo"
          name="dateTo"
          type="date"
          defaultValue={parseTextParam(dateTo)}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">Apply</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/staff-attendance")}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
