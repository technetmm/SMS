import type { DayOfWeek } from "@/app/generated/prisma/enums";
import { rangesOverlap, timeToMinutes } from "@/lib/time";

export type TimetableBlock = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
};

export function suggestNextSlot(options: {
  existing: TimetableBlock[];
  dayOfWeek: DayOfWeek;
  durationMinutes: number;
  workdayStart?: string;
  workdayEnd?: string;
}) {
  const workdayStart = options.workdayStart ?? "09:00";
  const workdayEnd = options.workdayEnd ?? "18:00";

  const duration = options.durationMinutes;
  const startLimit = timeToMinutes(workdayStart);
  const endLimit = timeToMinutes(workdayEnd);

  const sameDay = options.existing
    .filter((block) => block.dayOfWeek === options.dayOfWeek)
    .slice()
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  let cursor = startLimit;
  for (const block of sameDay) {
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);

    const candidateStart = cursor;
    const candidateEnd = candidateStart + duration;
    const candidateStartStr = `${String(Math.floor(candidateStart / 60)).padStart(2, "0")}:${String(candidateStart % 60).padStart(2, "0")}`;
    const candidateEndStr = `${String(Math.floor(candidateEnd / 60)).padStart(2, "0")}:${String(candidateEnd % 60).padStart(2, "0")}`;

    if (candidateEnd <= endLimit && !rangesOverlap(block.startTime, block.endTime, candidateStartStr, candidateEndStr) && candidateEnd <= blockStart) {
      return { startTime: candidateStartStr, endTime: candidateEndStr };
    }

    cursor = Math.max(cursor, blockEnd);
  }

  const finalStart = cursor;
  const finalEnd = finalStart + duration;
  if (finalEnd <= endLimit) {
    return {
      startTime: `${String(Math.floor(finalStart / 60)).padStart(2, "0")}:${String(finalStart % 60).padStart(2, "0")}`,
      endTime: `${String(Math.floor(finalEnd / 60)).padStart(2, "0")}:${String(finalEnd % 60).padStart(2, "0")}`,
    };
  }

  return null;
}

