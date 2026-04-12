"use client";

import React from "react";
import { TableFilterSelect } from "../shared/table-filter-select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { parseTextParam } from "@/lib/table-filters";

export function AttendanceFilters({
  q,
  studentId,
  sectionId,
  status,
  date,
  dateFrom,
  dateTo,
  students,
  sections,
}: {
  q?: string;
  studentId?: string;
  sectionId?: string;
  status?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  students: { id: string; name: string }[];
  sections: { id: string; name: string; class: { name: string } }[];
}) {
  return (
    <form className="grid gap-4 md:grid-cols-4" method="get">
      <div className="grid gap-2">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Student, section, class"
        />
      </div>

      <TableFilterSelect
        id="studentId"
        name="studentId"
        label="Student"
        placeholder="All students"
        defaultValue={studentId}
        allLabel="All students"
        options={students.map((student) => ({
          value: student.id,
          label: student.name,
        }))}
      />

      <TableFilterSelect
        id="sectionId"
        name="sectionId"
        label="Section"
        placeholder="All sections"
        defaultValue={sectionId}
        allLabel="All sections"
        options={sections.map((section) => ({
          value: section.id,
          label: `${section.class.name} • ${section.name}`,
        }))}
      />

      <div className="grid gap-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" defaultValue={date ?? ""} />
      </div>

      <TableFilterSelect
        id="status"
        name="status"
        label="Status"
        placeholder="All statuses"
        defaultValue={status}
        allLabel="All statuses"
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
        <Button type="submit" variant="default">
          Apply
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/attendance")}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
