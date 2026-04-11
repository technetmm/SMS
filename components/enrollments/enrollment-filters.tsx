"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TableFilterSelect } from "@/components/shared/table-filter-select";
import { parseTextParam } from "@/lib/table-filters";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EnrollmentFilters({
  q,
  status,
  enrolledFrom,
  enrolledTo,
}: {
  q?: string;
  status?: string;
  enrolledFrom?: string;
  enrolledTo?: string;
}) {
  return (
    <form method="get" className="grid gap-4 md:grid-cols-4">
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Student, section, or class"
        />
      </div>
      <TableFilterSelect
        id="status"
        name="status"
        label="Status"
        placeholder="All statuses"
        defaultValue={status}
        options={[
          { value: "ACTIVE", label: "Active" },
          { value: "COMPLETED", label: "Completed" },
          { value: "DROPPED", label: "Dropped" },
        ]}
      />
      <div className="grid gap-2">
        <Label htmlFor="enrolledFrom">Enrolled From</Label>
        <Input
          id="enrolledFrom"
          name="enrolledFrom"
          type="date"
          defaultValue={parseTextParam(enrolledFrom)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="enrolledTo">Enrolled To</Label>
        <Input
          id="enrolledTo"
          name="enrolledTo"
          type="date"
          defaultValue={parseTextParam(enrolledTo)}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">Apply</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/enrollments")}
        >Reset</Button>
      </div>
    </form>
  );
}
