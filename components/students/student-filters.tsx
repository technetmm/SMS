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
}: {
  query?: string;
  status?: string;
}) {
  const [selectedStatus, setSelectedStatus] = useState(status ?? "ALL");

  return (
    <form className="flex flex-col gap-3 md:flex-row md:items-end">
      <div className="grid gap-2 md:w-64">
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
      <div className="grid gap-2 md:w-52">
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
      <div className="flex gap-2">
        <Button type="submit">Apply</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/students")}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
