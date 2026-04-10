"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { DayOfWeek } from "@/app/generated/prisma/enums";
import {
  deleteTimetableSlotById,
  duplicateTimetableSlot,
  moveTimetableSlot,
} from "@/app/(school)/school/timetable/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { enumLabel, DAY_OF_WEEK_LABELS } from "@/lib/enum-labels";

type Slot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  staff: { id: string; name: string };
  section: { id: string; name: string; class: { id: string; name: string } };
};

const days: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function DragDropWeekTimetable({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copiedSlotId, setCopiedSlotId] = useState<string | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<Slot | null>(null);

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

  const onPasteDay = (day: DayOfWeek) => {
    if (!copiedSlotId) {
      toast.error("Copy a slot first");
      return;
    }

    startTransition(async () => {
      const result = await duplicateTimetableSlot(copiedSlotId, day);
      if (result.status === "error") {
        toast.error(result.message ?? "Unable to paste slot");
        return;
      }
      toast.success(`Slot pasted to ${enumLabel(day, DAY_OF_WEEK_LABELS)}`);
      router.refresh();
    });
  };

  const onDeleteSlot = () => {
    if (!slotToDelete) return;

    const target = slotToDelete;
    startTransition(async () => {
      const result = await deleteTimetableSlotById(target.id);
      if (result.status === "error") {
        toast.error(result.message ?? "Unable to delete slot");
        return;
      }
      if (copiedSlotId === target.id) {
        setCopiedSlotId(null);
      }
      setSlotToDelete(null);
      toast.success("Slot deleted");
      router.refresh();
    });
  };

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Weekly Board</h3>
          <p className="text-xs text-muted-foreground">
            Drag to move, or right-click to copy and paste slots across days.
          </p>
        </div>
        <p className={cn("text-xs text-muted-foreground", pending && "text-primary")}>
          {pending ? "Updating..." : null}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => (
          <ContextMenu key={day}>
            <ContextMenuTrigger asChild>
              <div
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
                    <ContextMenu key={slot.id}>
                      <ContextMenuTrigger asChild>
                        <div
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", slot.id);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          className={cn(
                            "cursor-grab rounded-md border bg-background p-2 text-xs shadow-sm active:cursor-grabbing",
                            copiedSlotId === slot.id &&
                              "border-primary/60 ring-1 ring-primary/30",
                            pending && "pointer-events-none opacity-70",
                          )}
                          title={`${slot.staff.name} • ${slot.section.class.name} • ${slot.section.name}`}
                        >
                          <div className="font-medium">
                            {slot.startTime}-{slot.endTime}
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            {slot.section.name}
                          </div>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() => {
                            setCopiedSlotId(slot.id);
                            toast.success("Slot copied");
                          }}
                        >
                          Copy slot
                        </ContextMenuItem>
                        <ContextMenuItem
                          disabled={!copiedSlotId}
                          onClick={() => onPasteDay(day)}
                        >
                          Paste into {enumLabel(day, DAY_OF_WEEK_LABELS)}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          variant="destructive"
                          disabled={pending}
                          onClick={() => setSlotToDelete(slot)}
                        >
                          Delete slot
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                  {(byDay.get(day) ?? []).length === 0 ? (
                    <div className="rounded-md border border-dashed bg-background/60 p-2 text-center text-[11px] text-muted-foreground">
                      Drop here
                    </div>
                  ) : null}
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuLabel>{enumLabel(day, DAY_OF_WEEK_LABELS)}</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem
                disabled={!copiedSlotId}
                onClick={() => onPasteDay(day)}
              >
                Paste copied slot here
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>

      <AlertDialog
        open={slotToDelete != null}
        onOpenChange={(open) => {
          if (pending) return;
          if (!open) setSlotToDelete(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete timetable slot?</AlertDialogTitle>
            <AlertDialogDescription>
              {slotToDelete
                ? `${enumLabel(slotToDelete.dayOfWeek, DAY_OF_WEEK_LABELS)} • ${slotToDelete.startTime}-${slotToDelete.endTime} • ${slotToDelete.section.name}`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                onDeleteSlot();
              }}
            >
              {pending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
