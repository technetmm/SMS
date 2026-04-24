const DEFAULT_APP_TIME_ZONE = "Asia/Yangon";

function resolveAppTimeZone() {
  const configured = process.env.APP_TIME_ZONE?.trim();
  if (!configured) {
    return DEFAULT_APP_TIME_ZONE;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: configured });
    return configured;
  } catch {
    return DEFAULT_APP_TIME_ZONE;
  }
}

export const APP_TIME_ZONE = resolveAppTimeZone();

const APP_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type AppDateTimePartKey = "year" | "month" | "day" | "hour" | "minute";

function getNumericPart(parts: Intl.DateTimeFormatPart[], key: AppDateTimePartKey) {
  const value = parts.find((part) => part.type === key)?.value;
  if (!value) {
    throw new Error(`Missing ${key} part for app time conversion.`);
  }
  return Number(value);
}

export function getAppDateTimeParts(now = new Date()) {
  const parts = APP_DATE_TIME_FORMATTER.formatToParts(now);
  const weekdayShort = parts.find((part) => part.type === "weekday")?.value ?? "Sun";

  return {
    year: getNumericPart(parts, "year"),
    month: getNumericPart(parts, "month"),
    day: getNumericPart(parts, "day"),
    hour: getNumericPart(parts, "hour"),
    minute: getNumericPart(parts, "minute"),
    weekdayShort,
  };
}

export function getAppIsoDate(now = new Date()) {
  const { year, month, day } = getAppDateTimeParts(now);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getAppStartOfMonthUtc(now = new Date()) {
  const { year, month } = getAppDateTimeParts(now);
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}
