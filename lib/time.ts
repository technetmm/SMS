export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    throw new Error("Invalid time value.");
  }
  return hours * 60 + minutes;
}

export function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);
  return aStart < bEnd && aEnd > bStart;
}

export function minutesToTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  const now = new Date();

  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0,
  );

  return date.getTime();
}
