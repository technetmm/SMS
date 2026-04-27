import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { AuthSessionProvider } from "@/components/shared/session-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ActivityTracker } from "@/components/auth/activity-tracker";
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
          <AuthSessionProvider>
            <ActivityTracker />
            {children}
          </AuthSessionProvider>
          <Toaster position="top-right" />
        </TooltipProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
