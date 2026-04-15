export const locales = ["en", "my"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";
export const localeCookieName = "NEXT_LOCALE";

export function hasLocale(value: string | null | undefined): value is AppLocale {
  return locales.includes(value as AppLocale);
}

const messageLoaders = {
  en: () => import("../messages/en.json").then((module) => module.default),
  my: () => import("../messages/my.json").then((module) => module.default),
} satisfies Record<AppLocale, () => Promise<Record<string, unknown>>>;

export async function getMessagesForLocale(locale: AppLocale) {
  return messageLoaders[locale]();
}
