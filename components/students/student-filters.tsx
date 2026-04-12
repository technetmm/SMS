"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableFilterSelect } from "@/components/shared/table-filter-select";

export function StudentFilters({
  query,
  status,
  gender,
  admissionFrom,
  admissionTo,
}: {
  query?: string;
  status?: string;
  gender?: string;
  admissionFrom?: string;
  admissionTo?: string;
}) {
  return (
    <form className="grid gap-3 md:grid-cols-3">
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="q">
          Search
        </label>
        <Input
          id="q"
          name="q"
          placeholder="Search by name or phone"
          defaultValue={query}
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
          { value: "INACTIVE", label: "Inactive" },
          { value: "GRADUATED", label: "Graduated" },
        ]}
      />
      <TableFilterSelect
        id="gender"
        name="gender"
        label="Gender"
        placeholder="All genders"
        defaultValue={gender}
        options={[
          { value: "MALE", label: "Male" },
          { value: "FEMALE", label: "Female" },
          { value: "OTHER", label: "Other" },
        ]}
      />
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="admissionFrom">
          Admission From
        </label>
        <Input
          id="admissionFrom"
          name="admissionFrom"
          type="date"
          defaultValue={admissionFrom}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="admissionTo">
          Admission To
        </label>
        <Input
          id="admissionTo"
          name="admissionTo"
          type="date"
          defaultValue={admissionTo}
        />
      </div>
      <div className="flex gap-2 items-end">
        <Button type="submit">Apply</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/students")}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
