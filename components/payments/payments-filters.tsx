"use client";

import { parseTextParam } from "@/lib/table-filters";
import { TableFilterSelect } from "../shared/table-filter-select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "@/components/ui/button";

export function PaymentsFilters({
  q,
  status,
  dueFrom,
  dueTo,
  totalMin,
  totalMax,
}: {
  q?: string;
  status?: string;
  dueFrom?: string;
  dueTo?: string;
  totalMin?: string;
  totalMax?: string;
}) {
  return (
    <form className="mb-4 grid gap-4 md:grid-cols-4" method="get">
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Invoice id or student"
        />
      </div>
      <TableFilterSelect
        id="status"
        name="status"
        label="Status"
        placeholder="All statuses"
        defaultValue={status}
        options={[
          { value: "UNPAID", label: "Unpaid" },
          { value: "PARTIAL", label: "Partial" },
          { value: "PAID", label: "Paid" },
        ]}
      />
      <div className="grid gap-2">
        <Label htmlFor="dueFrom">Due From</Label>
        <Input
          id="dueFrom"
          name="dueFrom"
          type="date"
          defaultValue={parseTextParam(dueFrom)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dueTo">Due To</Label>
        <Input
          id="dueTo"
          name="dueTo"
          type="date"
          defaultValue={parseTextParam(dueTo)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="totalMin">Total Min</Label>
        <Input
          id="totalMin"
          name="totalMin"
          type="number"
          step="0.01"
          defaultValue={totalMin}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="totalMax">Total Max</Label>
        <Input
          id="totalMax"
          name="totalMax"
          type="number"
          step="0.01"
          defaultValue={totalMax}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">Apply</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/payments")}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
