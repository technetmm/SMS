export type ScheduleSlot = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  staffId?: string | null;
};

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function hasScheduleConflict(existing: ScheduleSlot[], candidate: ScheduleSlot) {
  const candidateStart = toMinutes(candidate.startTime);
  const candidateEnd = toMinutes(candidate.endTime);

  return existing.some((slot) => {
    if (slot.dayOfWeek !== candidate.dayOfWeek) return false;
    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);
    const overlaps = candidateStart < end && candidateEnd > start;

    const roomConflict =
      candidate.room && slot.room && slot.room === candidate.room;
    const staffConflict =
      candidate.staffId && slot.staffId && slot.staffId === candidate.staffId;

    return overlaps && (roomConflict || staffConflict);
  });
}
