"use client";

import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const { data } = useSession();
  const t = useTranslations("Topbar");
  const locale = useLocale();
  const userName = data?.user?.name ?? data?.user?.email ?? t("account");

  return (
    <header className="flex items-center justify-between border-b bg-background px-6 py-4">
      <div>
        <p className="text-sm text-muted-foreground">{t("welcomeBack")}</p>
        <h2 className="text-lg font-semibold">{userName}</h2>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
      >
        {t("signOut")}
      </Button>
    </header>
  );
}
