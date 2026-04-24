export const dateFormatter = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: locale === "en" ? "medium" : "long",
  });

export const numberFormatter = (locale: string) =>
  new Intl.NumberFormat(locale);

export const currencyFormatter = (locale: string) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  });

export const percentFormatter = (locale: string) =>
  new Intl.NumberFormat(locale, { style: "percent" });

export const dateFormatterWithTime = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: locale === "en" ? "medium" : "long",
    timeStyle: "short",
  });

export const dateTimeFormatter = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: locale === "en" ? "medium" : "long",
    timeStyle: "short",
  });

export const dateTimeFormatterWithSeconds = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: locale === "en" ? "medium" : "long",
    timeStyle: "short",
    second: "numeric",
  });

const TIME_24H_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const timetableTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function getTimetableTimeFormatter(locale: string) {
  let formatter = timetableTimeFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    timetableTimeFormatters.set(locale, formatter);
  }
  return formatter;
}

function parse24HourTime(value: string) {
  if (!TIME_24H_PATTERN.test(value)) {
    return null;
  }
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  return { hours, minutes };
}

export function formatTimetableTime(value: string, locale: string) {
  const parsed = parse24HourTime(value);
  if (!parsed) {
    return value;
  }
  const date = new Date(2000, 0, 1, parsed.hours, parsed.minutes, 0, 0);
  return getTimetableTimeFormatter(locale).format(date);
}

export function formatTimetableTimeRange(start: string, end: string, locale: string) {
  return `${formatTimetableTime(start, locale)} - ${formatTimetableTime(end, locale)}`;
}
