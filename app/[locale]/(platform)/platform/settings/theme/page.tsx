import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "@/components/settings/theme-toggle";

export default async function PlatformThemeSettingsPage() {
  const t = await getTranslations("SettingsPages.theme");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <ThemeToggle />
    </div>
  );
}
