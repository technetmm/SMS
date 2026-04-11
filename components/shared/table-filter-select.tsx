"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TABLE_FILTER_ALL_VALUE } from "@/lib/table-filters";

type TableFilterOption = {
  value: string;
  label: string;
};

export function TableFilterSelect({
  name,
  label,
  placeholder,
  defaultValue,
  allLabel = "All",
  options,
  id,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  allLabel?: string;
  options: TableFilterOption[];
  id: string;
}) {
  const [selectedValue, setSelectedValue] = useState(
    defaultValue && defaultValue.length > 0
      ? defaultValue
      : TABLE_FILTER_ALL_VALUE,
  );

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={selectedValue} onValueChange={setSelectedValue}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={TABLE_FILTER_ALL_VALUE}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name={name} value={selectedValue} />
    </div>
  );
}
