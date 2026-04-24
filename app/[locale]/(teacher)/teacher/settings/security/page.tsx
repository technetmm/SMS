import { getLocale, getTranslations } from "next-intl/server";
import { getServerAuth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SecuritySettings } from "@/components/settings/security-settings";
import { redirect } from "@/i18n/navigation";

function formatLastLogin(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function TeacherSecurityPage() {
  const locale = await getLocale();
  const t = await getTranslations("SettingsPages.security");
  const session = await getServerAuth();
  const sessionUser = session?.user;
  if (!sessionUser?.id) {
    redirect({ href: "/login", locale });
  }
  const verifiedSessionUser = sessionUser!;

  const user = await prisma.user.findUnique({
    where: { id: verifiedSessionUser.id },
    select: { twoFactorEnabled: true, updatedAt: true },
  });

  if (!user) {
    redirect({ href: "/login", locale });
  }
  const currentUser = user!;

  const lastLogin = formatLastLogin(currentUser.updatedAt ?? new Date(), locale);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <SecuritySettings
        lastLogin={lastLogin}
        twoFactorEnabled={currentUser.twoFactorEnabled}
      />
    </div>
  );
}
