"use client";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { TableFilterSelect } from "../shared/table-filter-select";
import { Button } from "../ui/button";
import { parseTextParam } from "@/lib/table-filters";

export function ClassFilters({
  q,
  classType,
  programType,
  billingType,
  createdFrom,
  createdTo,
  feeMin,
  feeMax,
}: {
  q?: string;
  classType?: string;
  programType?: string;
  billingType?: string;
  createdFrom?: string;
  createdTo?: string;
  feeMin?: string;
  feeMax?: string;
}) {
  return (
    <form className="grid gap-4 md:grid-cols-4" method="get">
      <div className="grid gap-2">
        <Label htmlFor="q">Search</Label>
        <Input id="q" name="q" defaultValue={q} placeholder="Class or course" />
      </div>
      <TableFilterSelect
        id="classType"
        name="classType"
        label="Class Type"
        placeholder="All class types"
        defaultValue={classType}
        options={[
          { value: "ONE_ON_ONE", label: "One On One" },
          { value: "PRIVATE", label: "Private" },
          { value: "GROUP", label: "Group" },
        ]}
      />
      <TableFilterSelect
        id="programType"
        name="programType"
        label="Program Type"
        placeholder="All program types"
        defaultValue={programType}
        options={[
          { value: "REGULAR", label: "Regular" },
          { value: "INTENSIVE", label: "Intensive" },
        ]}
      />
      <TableFilterSelect
        id="billingType"
        name="billingType"
        label="Billing Type"
        placeholder="All billing types"
        defaultValue={billingType}
        options={[
          { value: "ONE_TIME", label: "One Time" },
          { value: "MONTHLY", label: "Monthly" },
        ]}
      />
      <div className="grid gap-2">
        <Label htmlFor="createdFrom">Created From</Label>
        <Input
          id="createdFrom"
          name="createdFrom"
          type="date"
          defaultValue={parseTextParam(createdFrom)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="createdTo">Created To</Label>
        <Input
          id="createdTo"
          name="createdTo"
          type="date"
          defaultValue={parseTextParam(createdTo)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="feeMin">Fee Min</Label>
        <Input
          id="feeMin"
          name="feeMin"
          type="number"
          step="0.01"
          defaultValue={feeMin}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="feeMax">Fee Max</Label>
        <Input
          id="feeMax"
          name="feeMax"
          type="number"
          step="0.01"
          defaultValue={feeMax}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">Apply</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/classes")}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
