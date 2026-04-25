import { DayOfWeek } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { minutesToTime, timeToMinutes } from "@/lib/time";

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

const WEEKDAY_SHORT_TO_TIMETABLE_DAY: Record<string, DayOfWeek> = {
  Sun: DayOfWeek.SUN,
  Mon: DayOfWeek.MON,
  Tue: DayOfWeek.TUE,
  Wed: DayOfWeek.WED,
  Thu: DayOfWeek.THU,
  Fri: DayOfWeek.FRI,
  Sat: DayOfWeek.SAT,
};

export type TimetableNowContext = {
  dayOfWeek: DayOfWeek;
  nowMinutes: number;
};

export function createTimetableNowContext(
  now: Date,
  timeZone?: string,
): TimetableNowContext {
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(now);
      const weekday = parts.find((part) => part.type === "weekday")?.value;
      const hour = Number(parts.find((part) => part.type === "hour")?.value);
      const minute = Number(
        parts.find((part) => part.type === "minute")?.value,
      );

      if (
        weekday &&
        WEEKDAY_SHORT_TO_TIMETABLE_DAY[weekday] &&
        Number.isFinite(hour) &&
        Number.isFinite(minute)
      ) {
        return {
          dayOfWeek: WEEKDAY_SHORT_TO_TIMETABLE_DAY[weekday],
          nowMinutes: hour * 60 + minute,
        };
      }
    } catch {
      // Fall back to browser-local time if timezone is invalid/unavailable.
    }
  }

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
  console.log("getTimetableSlotState", slot, now);
  if (!isTodayTimetableDay(slot.dayOfWeek, now)) {
    return "default";
  }

  const nowTime = new Date().getTime();
  const startTime = minutesToTime(slot.startTime);
  const endTime = minutesToTime(slot.endTime);

  console.log(nowTime, startTime, endTime);

  const nowMinute = now.nowMinutes;
  const startMinute = timeToMinutes(slot.startTime);
  const endMinute = timeToMinutes(slot.endTime);
  console.log(nowMinute, startMinute, endMinute);

  if (nowTime < startTime) {
    return "upcoming";
  }

  if (nowTime >= endTime) {
    return "past";
  }

  return "active";
}

export function getTimetableSlotRemainingMinutes(
  slot: TimetableSlotLike,
  now: TimetableNowContext,
) {
  if (!isTodayTimetableDay(slot.dayOfWeek, now)) {
    return null;
  }

  const remainingMinutes = timeToMinutes(slot.endTime) - now.nowMinutes;
  return Math.max(0, remainingMinutes);
}

export function getTimetableSlotStartsInMinutes(
  slot: TimetableSlotLike,
  now: TimetableNowContext,
) {
  if (!isTodayTimetableDay(slot.dayOfWeek, now)) {
    return null;
  }

  const startsInMinutes = timeToMinutes(slot.startTime) - now.nowMinutes;
  return Math.max(0, startsInMinutes);
}

export function isTimetableSlotEndingSoon(
  slot: TimetableSlotLike,
  now: TimetableNowContext,
  thresholdMinutes = 2,
) {
  if (getTimetableSlotState(slot, now) !== "active") {
    return false;
  }

  const remainingMinutes = getTimetableSlotRemainingMinutes(slot, now);
  return remainingMinutes != null && remainingMinutes <= thresholdMinutes;
}

export function isTimetableSlotStartingSoon(
  slot: TimetableSlotLike,
  now: TimetableNowContext,
  thresholdMinutes = 2,
) {
  if (getTimetableSlotState(slot, now) !== "upcoming") {
    return false;
  }

  const startsInMinutes = getTimetableSlotStartsInMinutes(slot, now);
  return startsInMinutes != null && startsInMinutes <= thresholdMinutes;
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

export function getTimetableDayBackgroundClass(
  day: DayOfWeek,
  now: TimetableNowContext,
) {
  return cn(
    "rounded-md border p-2",
    isTodayTimetableDay(day, now)
      ? "border-slate-300 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-950/40"
      : "bg-muted/40",
  );
}
