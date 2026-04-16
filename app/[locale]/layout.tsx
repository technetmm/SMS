import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { AuthSessionProvider } from "@/components/shared/session-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "my" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <div className="fixed right-4 top-4 z-50">
            <LocaleSwitcher />
          </div>
          <AuthSessionProvider>{children}</AuthSessionProvider>
          <Toaster position="top-right" />
        </TooltipProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
