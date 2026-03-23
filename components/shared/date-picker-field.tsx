"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

function formatDateLabel(date?: Date) {
  if (!date) return "Pick a date";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function toInputDate(date?: Date) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function DatePickerField({
  name,
  label,
  defaultValue,
  ...props
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const initialDate = useMemo(
    () => (defaultValue ? new Date(defaultValue) : undefined),
    [defaultValue],
  );
  const [date, setDate] = useState<Date | undefined>(initialDate);

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="justify-start">
            {formatDateLabel(date)}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(value) => setDate(value ?? undefined)}
            className="rounded-lg border"
            captionLayout="dropdown"
            {...props}
          />
        </PopoverContent>
      </Popover>
      <input type="hidden" name={name} value={toInputDate(date)} />
    </div>
  );
}
