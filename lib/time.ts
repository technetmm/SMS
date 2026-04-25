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

export function minutesToTime(value: string) {
  const date = new Date();
  date.setHours(Number(value.split(":")[0]), Number(value.split(":")[1]), 0, 0);
  return date.getTime();
}
