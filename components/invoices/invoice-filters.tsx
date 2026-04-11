"use client";

import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";
import { TableFilterSelect } from "../shared/table-filter-select";
import { parseTextParam } from "@/lib/table-filters";
import { Button } from "../ui/button";

export function InvoicesFilters({
  q,
  status,
  invoiceType,
  dueFrom,
  dueTo,
  finalMin,
  finalMax,
}: {
  q?: string;
  status?: string;
  invoiceType?: string;
  dueFrom?: string;
  dueTo?: string;
  finalMin?: number;
  finalMax?: number;
}) {
  return (
    <form className="grid gap-4 md:grid-cols-4" method="get">
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Invoice, student, class, section"
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
      <TableFilterSelect
        id="invoiceType"
        name="invoiceType"
        label="Invoice Type"
        placeholder="All invoice types"
        defaultValue={invoiceType}
        options={[
          { value: "ONE_TIME", label: "One Time" },
          { value: "MONTHLY", label: "Monthly" },
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
        <Label htmlFor="finalMin">Final Min</Label>
        <Input
          id="finalMin"
          name="finalMin"
          type="number"
          step="0.01"
          defaultValue={finalMin}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="finalMax">Final Max</Label>
        <Input
          id="finalMax"
          name="finalMax"
          type="number"
          step="0.01"
          defaultValue={finalMax}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">Apply</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/invoices")}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
