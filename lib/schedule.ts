export type ScheduleSlot = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  teacherId?: string | null;
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
    const teacherConflict =
      candidate.teacherId && slot.teacherId && slot.teacherId === candidate.teacherId;

    return overlaps && (roomConflict || teacherConflict);
  });
}
