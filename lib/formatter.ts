import { Currency } from "@/app/generated/prisma/enums";

export const dateFormatter = (
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) =>
  new Intl.DateTimeFormat(
    locale,
    options || {
      dateStyle: "long",
    },
  );

export const numberFormatter = (
  locale: string,
  options?: Intl.NumberFormatOptions,
) => new Intl.NumberFormat(locale, options);

export const currencyFormatter = (
  locale: string,
  options?: Intl.NumberFormatOptions,
) =>
  new Intl.NumberFormat(
    locale,
    options || {
      style: "currency",
      currency: "USD",
    },
  );

export const percentFormatter = (
  locale: string,
  options?: Intl.NumberFormatOptions,
) => new Intl.NumberFormat(locale, options || { style: "percent" });

export const dateFormatterWithTime = (
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) =>
  new Intl.DateTimeFormat(
    locale,
    options || {
      dateStyle: "long",
      timeStyle: "short",
    },
  );

export const dateTimeFormatter = (
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) =>
  new Intl.DateTimeFormat(
    locale,
    options || {
      dateStyle: "long",
      timeStyle: "short",
    },
  );

export const dateTimeFormatterWithSeconds = (
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) =>
  new Intl.DateTimeFormat(
    locale,
    options || {
      dateStyle: "long",
      timeStyle: "short",
      second: "numeric",
    },
  );

const TIME_24H_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const timetableTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function getTimetableTimeFormatter(
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) {
  let formatter = timetableTimeFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(
      locale,
      options || {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      },
    );
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

export function formatTimetableTimeRange(
  start: string,
  end: string,
  locale: string,
) {
  return `${formatTimetableTime(start, locale)} - ${formatTimetableTime(end, locale)}`;
}

const moneyCache = new Map<string, Intl.NumberFormat>();
export const money = (currency: Currency | string) => {
  const cached = moneyCache.get(currency);
  if (cached) return cached;
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
  moneyCache.set(currency, fmt);
  return fmt;
};

export function formatMoney(
  amount: number | string,
  currency: Currency | string,
) {
  return money(currency).format(Number(amount));
}
