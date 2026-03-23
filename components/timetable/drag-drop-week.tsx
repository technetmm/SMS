"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { DayOfWeek } from "@/app/generated/prisma/enums";
import { moveTimetableSlot } from "@/app/(school)/timetable/actions";
import { cn } from "@/lib/utils";
import { enumLabel, DAY_OF_WEEK_LABELS } from "@/lib/enum-labels";

type Slot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  teacher: { id: string; name: string };
  section: { id: string; name: string; class: { id: string; name: string } };
};

const days: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function DragDropWeekTimetable({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const byDay = useMemo(() => {
    const map = new Map<DayOfWeek, Slot[]>();
    for (const day of days) map.set(day, []);
    for (const slot of slots) {
      map.get(slot.dayOfWeek)?.push(slot);
    }
    for (const day of days) {
      map.get(day)?.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [slots]);

  const onDropDay = (day: DayOfWeek, slotId: string) => {
    startTransition(async () => {
      const result = await moveTimetableSlot(slotId, day);
      if (result.status === "error") {
        toast.error(result.message ?? "Unable to move slot");
        return;
      }
      toast.success("Slot updated");
      router.refresh();
    });
  };

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Weekly Board</h3>
          <p className="text-xs text-muted-foreground">
            Drag a block to another day to reschedule (time stays the same).
          </p>
        </div>
        <p className={cn("text-xs text-muted-foreground", pending && "text-primary")}>
          {pending ? "Updating..." : null}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => (
          <div
            key={day}
            className="rounded-md border bg-muted/20 p-2"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const slotId = event.dataTransfer.getData("text/plain");
              if (!slotId) return;
              onDropDay(day, slotId);
            }}
          >
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              {enumLabel(day, DAY_OF_WEEK_LABELS)}
            </div>
            <div className="space-y-2">
              {(byDay.get(day) ?? []).map((slot) => (
                <div
                  key={slot.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", slot.id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  className={cn(
                    "cursor-grab rounded-md border bg-background p-2 text-xs shadow-sm active:cursor-grabbing",
                    pending && "pointer-events-none opacity-70",
                  )}
                  title={`${slot.teacher.name} • ${slot.section.class.name} • ${slot.section.name}`}
                >
                  <div className="font-medium">
                    {slot.startTime}-{slot.endTime}
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {slot.section.name}
                  </div>
                </div>
              ))}
              {(byDay.get(day) ?? []).length === 0 ? (
                <div className="rounded-md border border-dashed bg-background/60 p-2 text-center text-[11px] text-muted-foreground">
                  Drop here
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

