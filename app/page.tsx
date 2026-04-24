import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { defaultLocale } from "@/i18n/config";
import LocaleHomePage from "./[locale]/page";

export { metadata } from "./[locale]/page";

export default async function RootRedirectPage() {
  const locale = await getLocale();

  if (locale !== defaultLocale) {
    redirect(`/${locale}`);
  }

  return <LocaleHomePage />;
}
