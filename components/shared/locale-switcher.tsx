"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { localeCookieName, locales, type AppLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const localeLabels: Record<AppLocale, string> = {
  en: "EN",
  my: "မြန်မာ",
};

type LocaleSwitcherProps = {
  className?: string;
};

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const t = useTranslations("LocaleSwitcher");
  const [isPending, startTransition] = useTransition();

  function updateLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;

    startTransition(() => {
      document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border bg-background/90 p-1 shadow-sm backdrop-blur",
        className,
      )}
      aria-label={t("label")}
    >
      <span className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
        <LanguagesIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("shortLabel")}</span>
      </span>
      {locales.map((nextLocale) => {
        const isActive = nextLocale === locale;

        return (
          <Button
            key={nextLocale}
            type="button"
            variant={isActive ? "default" : "ghost"}
            size="sm"
            disabled={isPending}
            onClick={() => updateLocale(nextLocale)}
            className={cn("rounded-full px-3 text-xs", !isActive && "shadow-none")}
            aria-pressed={isActive}
          >
            {localeLabels[nextLocale]}
          </Button>
        );
      })}
    </div>
  );
}
