import { DayOfWeek } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { timeToMinutes } from "@/lib/time";

type TimetableSlotLike = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
};

type TimetableSlotState = "active" | "upcoming" | "past" | "default";

const JS_DAY_TO_TIMETABLE_DAY: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUN,
  1: DayOfWeek.MON,
  2: DayOfWeek.TUE,
  3: DayOfWeek.WED,
  4: DayOfWeek.THU,
  5: DayOfWeek.FRI,
  6: DayOfWeek.SAT,
};

export type TimetableNowContext = {
  dayOfWeek: DayOfWeek;
  nowMinutes: number;
};

export function createTimetableNowContext(now: Date): TimetableNowContext {
  return {
    dayOfWeek: JS_DAY_TO_TIMETABLE_DAY[now.getDay()] ?? DayOfWeek.SUN,
    nowMinutes: now.getHours() * 60 + now.getMinutes(),
  };
}

function isTodayTimetableDay(day: DayOfWeek, now: TimetableNowContext) {
  return now.dayOfWeek === day;
}

export function getTimetableSlotState(
  slot: TimetableSlotLike,
  now: TimetableNowContext,
): TimetableSlotState {
  if (!isTodayTimetableDay(slot.dayOfWeek, now)) {
    return "default";
  }

  const startMinutes = timeToMinutes(slot.startTime);
  const endMinutes = timeToMinutes(slot.endTime);

  if (now.nowMinutes < startMinutes) {
    return "upcoming";
  }

  if (now.nowMinutes >= endMinutes) {
    return "past";
  }

  return "active";
}

export function getTimetableSlotBackgroundClass(state: TimetableSlotState) {
  if (state === "active") {
    return "border-emerald-300 bg-emerald-100/70 dark:border-emerald-800 dark:bg-emerald-950/40";
  }

  if (state === "upcoming") {
    return "border-sky-300 bg-sky-100/60 dark:border-sky-800 dark:bg-sky-950/40";
  }

  if (state === "past") {
    return "bg-muted/40";
  }

  return "";
}

export function getTimetableDayBackgroundClass(day: DayOfWeek, now: TimetableNowContext) {
  return cn(
    "rounded-md border p-2",
    isTodayTimetableDay(day, now)
      ? "border-slate-300 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-950/40"
      : "bg-muted/40",
  );
}
