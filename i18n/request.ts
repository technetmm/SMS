import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  defaultLocale,
  getMessagesForLocale,
  hasLocale,
  localeCookieName,
  locales,
} from "@/i18n/config";

function getLocaleFromHeader(acceptLanguage: string | null) {
  if (!acceptLanguage) return defaultLocale;

  const normalizedLanguages = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const language of normalizedLanguages) {
    const matchedLocale = locales.find(
      (locale) => language === locale || language.startsWith(`${locale}-`),
    );

    if (matchedLocale) {
      return matchedLocale;
    }
  }

  return defaultLocale;
}

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const requestedLocale = locale ?? (await requestLocale);

  let resolvedLocale = hasLocale(requestedLocale) ? requestedLocale : null;

  if (!resolvedLocale) {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(localeCookieName)?.value;
    resolvedLocale = hasLocale(cookieLocale) ? cookieLocale : null;
  }

  if (!resolvedLocale) {
    const headerStore = await headers();
    resolvedLocale = getLocaleFromHeader(headerStore.get("accept-language"));
  }

  return {
    locale: resolvedLocale,
    messages: await getMessagesForLocale(resolvedLocale),
  };
});
