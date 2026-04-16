import { defineRouting } from "next-intl/routing";
import {
  defaultLocale,
  localeCookieName,
  locales,
} from "@/i18n/config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeCookie: {
    name: localeCookieName,
    sameSite: "lax",
  },
});
