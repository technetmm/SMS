import { getTranslations } from "next-intl/server";
import { ArrowRight, Image as ImageIcon, KeyRound, Languages, LockKeyhole, Mail, Palette, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";

export default async function TeacherSettingsPage() {
  const t = await getTranslations("TeacherSettingsOverview");
  const tCommon = await getTranslations("Common");

  const cards = [
    {
      title: t("theme.title"),
      description: t("theme.description"),
      href: "/teacher/settings/theme",
      icon: Palette,
    },
    {
      title: t("profilePhoto.title"),
      description: t("profilePhoto.description"),
      href: "/teacher/settings/profile-photo",
      icon: ImageIcon,
    },
    {
      title: t("email.title"),
      description: t("email.description"),
      href: "/teacher/settings/change-email",
      icon: Mail,
    },
    {
      title: t("password.title"),
      description: t("password.description"),
      href: "/teacher/settings/change-password",
      icon: KeyRound,
    },
    {
      title: t("twoFactorAuth.title"),
      description: t("twoFactorAuth.description"),
      href: "/teacher/settings/2fa",
      icon: LockKeyhole,
    },
    {
      title: t("security.title"),
      description: t("security.description"),
      href: "/teacher/settings/security",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/teacher/settings/security">
                {t("actions.securityStatus")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/teacher/settings/2fa">{t("actions.enable2fa")}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("overview.title")}</CardTitle>
            <CardDescription>{t("overview.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cards.map((card, index) => {
              const Icon = card.icon;

              return (
                <div key={card.href} className="space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/40 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{card.title}</p>
                        <p className="text-sm text-muted-foreground">{card.description}</p>
                      </div>
                    </div>
                    <Button asChild variant="outline">
                      <Link href={card.href}>
                        {tCommon("open")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  {index < cards.length - 1 ? <Separator /> : null}
                </div>
              );
            })}
            <Separator />
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/40 text-primary">
                  <Languages className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("language.title")}</p>
                  <p className="text-sm text-muted-foreground">{t("language.description")}</p>
                </div>
              </div>
              <LocaleSwitcher className="self-start md:self-center" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
