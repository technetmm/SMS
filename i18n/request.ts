import { getRequestConfig } from "next-intl/server";
import { defaultLocale, getMessagesForLocale } from "@/i18n/config";

export default getRequestConfig(async () => {
  return {
    locale: defaultLocale,
    messages: await getMessagesForLocale(defaultLocale),
  };
});
