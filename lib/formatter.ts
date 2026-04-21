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
