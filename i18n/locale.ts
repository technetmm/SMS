import { defaultLocale, hasLocale, type AppLocale } from "@/i18n/config";

export function getLocaleFromPathname(pathname: string): {
  locale: AppLocale | null;
  pathnameWithoutLocale: string;
} {
  const [, maybeLocale, ...rest] = pathname.split("/");

  if (hasLocale(maybeLocale)) {
    const pathnameWithoutLocale =
      `/${rest.join("/")}`.replace(/\/+$/, "") || "/";
    return { locale: maybeLocale, pathnameWithoutLocale };
  }

  return { locale: null, pathnameWithoutLocale: pathname || "/" };
}

export function withLocale(
  pathname: string,
  locale: AppLocale = defaultLocale,
) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `/${locale}${normalizedPath === "/" ? "" : normalizedPath}`;
}
