"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [selectedStatus, setSelectedStatus] = useState(status ?? "ALL");
  const [selectedGender, setSelectedGender] = useState(gender ?? "ALL");

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
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="status">
          Status
        </label>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="GRADUATED">Graduated</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="status" value={selectedStatus} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="gender">
          Gender
        </label>
        <Select value={selectedGender} onValueChange={setSelectedGender}>
          <SelectTrigger id="gender" className="w-full">
            <SelectValue placeholder="All genders" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="gender" value={selectedGender} />
      </div>
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
