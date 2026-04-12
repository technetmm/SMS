"use client";

import React from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { TableFilterSelect } from "../shared/table-filter-select";
import { Button } from "../ui/button";
import { parseTextParam, TABLE_FILTER_ALL_VALUE } from "@/lib/table-filters";

export function StaffFilters({
  q,
  status,
  role,
  hireFrom,
  hireTo,
}: {
  q?: string;
  status?: string;
  role?: string;
  hireFrom?: string;
  hireTo?: string;
}) {
  return (
    <form className="grid gap-4 md:grid-cols-4" method="get">
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Name, email, phone"
        />
      </div>
      <TableFilterSelect
        id="role"
        name="role"
        label="Role"
        placeholder="All roles"
        defaultValue={role ?? TABLE_FILTER_ALL_VALUE}
        options={[
          { value: "SCHOOL_ADMIN", label: "School Admin" },
          { value: "TEACHER", label: "Teacher" },
        ]}
      />
      <TableFilterSelect
        id="status"
        name="status"
        label="Status"
        placeholder="All statuses"
        defaultValue={status ?? TABLE_FILTER_ALL_VALUE}
        options={[
          { value: "ACTIVE", label: "Active" },
          { value: "ONLEAVE", label: "On Leave" },
          { value: "RESIGNED", label: "Resigned" },
          { value: "TERMINATED", label: "Terminated" },
        ]}
      />
      <div className="grid gap-2">
        <Label htmlFor="hireFrom">Hire From</Label>
        <Input
          id="hireFrom"
          name="hireFrom"
          type="date"
          defaultValue={parseTextParam(hireFrom)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="hireTo">Hire To</Label>
        <Input
          id="hireTo"
          name="hireTo"
          type="date"
          defaultValue={parseTextParam(hireTo)}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">Apply</Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/staff")}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
