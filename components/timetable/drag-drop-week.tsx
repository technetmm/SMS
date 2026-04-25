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
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { formatTimetableTimeRange } from "@/lib/formatter";
import {
  getTimetableDayBackgroundClass,
  getTimetableSlotBackgroundClass,
  getTimetableSlotState,
} from "@/lib/teacher-timetable-highlight";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useTimetableNowContext } from "@/hooks/use-timetable-now-context";

type Slot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  staff: { id: string; name: string };
  section: { id: string; name: string; class: { id: string; name: string } };
};

const days: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function DragDropWeekTimetable({
  slots,
  returnTo = "/school/timetable",
  timeZone,
}: {
  slots: Slot[];
  returnTo?: string;
  timeZone?: string;
}) {
  const t = useTranslations("SchoolEntities.timetable.board");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copiedSlotId, setCopiedSlotId] = useState<string | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<Slot | null>(null);
  const nowContext = useTimetableNowContext(timeZone);

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

  const dayLabel = (day: DayOfWeek) => {
    const key = day.toLowerCase() as
      | "mon"
      | "tue"
      | "wed"
      | "thu"
      | "fri"
      | "sat"
      | "sun";
    return t(`days.${key}`);
  };

  const formattedTimeRange = (start: string, end: string) =>
    formatTimetableTimeRange(start, end, locale);

  const onDropDay = (day: DayOfWeek, slotId: string) => {
    startTransition(async () => {
      const result = await moveTimetableSlot(slotId, day);
      if (result.status === "error") {
        toast.error(result.message ?? t("messages.unableToMove"));
        return;
      }
      toast.success(t("messages.updated"));
      router.refresh();
    });
  };

  const onPasteDay = (day: DayOfWeek) => {
    if (!copiedSlotId) {
      toast.error(t("messages.copyFirst"));
      return;
    }

    startTransition(async () => {
      const result = await duplicateTimetableSlot(copiedSlotId, day);
      if (result.status === "error") {
        toast.error(result.message ?? t("messages.unableToPaste"));
        return;
      }
      toast.success(t("messages.pastedTo", { day: dayLabel(day) }));
      router.refresh();
    });
  };

  const onDeleteSlot = () => {
    if (!slotToDelete) return;

    const target = slotToDelete;
    startTransition(async () => {
      const result = await deleteTimetableSlotById(target.id);
      if (result.status === "error") {
        toast.error(result.message ?? t("messages.unableToDelete"));
        return;
      }
      if (copiedSlotId === target.id) {
        setCopiedSlotId(null);
      }
      setSlotToDelete(null);
      toast.success(t("messages.deleted"));
      router.refresh();
    });
  };

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{t("title")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className="text-[11px]">
            {t("activeDay", { day: dayLabel(nowContext?.dayOfWeek ?? "MON") })}
          </Badge>
          <p className={cn("text-xs text-muted-foreground", pending && "text-primary")}>
            {pending ? t("updating") : null}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => (
          <ContextMenu key={day}>
            <ContextMenuTrigger asChild>
              <div
                className={
                  nowContext
                    ? getTimetableDayBackgroundClass(day, nowContext)
                    : "rounded-md border bg-muted/40 p-2"
                }
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const slotId = event.dataTransfer.getData("text/plain");
                  if (!slotId) return;
                  onDropDay(day, slotId);
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div
                    className={cn(
                      "text-xs font-medium text-muted-foreground",
                      nowContext?.dayOfWeek === day && "text-foreground",
                    )}
                  >
                    {dayLabel(day)}
                  </div>
                  {nowContext?.dayOfWeek === day ? (
                    <span
                      className="size-2 rounded-full bg-emerald-500"
                      aria-label={t("activeDay", { day: dayLabel(day) })}
                      title={t("activeDay", { day: dayLabel(day) })}
                    />
                  ) : null}
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
                            getTimetableSlotBackgroundClass(
                              nowContext
                                ? getTimetableSlotState(slot, nowContext)
                                : "default",
                            ),
                            copiedSlotId === slot.id &&
                              "border-primary/60 ring-1 ring-primary/30",
                            pending && "pointer-events-none opacity-70",
                          )}
                          title={`${slot.staff.name} • ${slot.section.class.name} • ${slot.section.name}`}
                        >
                          <div className="font-medium">
                            {formattedTimeRange(slot.startTime, slot.endTime)}
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
                            toast.success(t("messages.copied"));
                          }}
                        >
                          {t("actions.copySlot")}
                        </ContextMenuItem>
                        <ContextMenuItem
                          disabled={!copiedSlotId}
                          onClick={() => onPasteDay(day)}
                        >
                          {t("actions.pasteInto", { day: dayLabel(day) })}
                        </ContextMenuItem>
                        <ContextMenuItem
                          disabled={pending}
                          onClick={() => {
                            const params = new URLSearchParams({ returnTo });
                            router.push(
                              `/school/timetable/${slot.id}/edit?${params.toString()}`,
                            );
                          }}
                        >
                          {t("actions.editSlot")}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          variant="destructive"
                          disabled={pending}
                          onClick={() => setSlotToDelete(slot)}
                        >
                          {t("actions.deleteSlot")}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                  {(byDay.get(day) ?? []).length === 0 ? (
                    <div className="rounded-md border border-dashed bg-background/60 p-2 text-center text-[11px] text-muted-foreground">
                      {t("dropHere")}
                    </div>
                  ) : null}
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuLabel>{dayLabel(day)}</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem
                disabled={!copiedSlotId}
                onClick={() => onPasteDay(day)}
              >
                {t("actions.pasteCopiedHere")}
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
            <AlertDialogTitle>{t("dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {slotToDelete
                ? t("dialog.descriptionWithSlot", {
                    day: dayLabel(slotToDelete.dayOfWeek),
                    time: formattedTimeRange(slotToDelete.startTime, slotToDelete.endTime),
                    section: slotToDelete.section.name,
                  })
                : t("dialog.descriptionFallback")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {t("dialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                onDeleteSlot();
              }}
            >
              {pending ? t("dialog.deleting") : t("dialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
