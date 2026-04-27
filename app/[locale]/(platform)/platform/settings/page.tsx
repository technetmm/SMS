import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  KeyRound,
  Languages,
  LockKeyhole,
  Mail,
  Palette,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { type AppLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";

export default async function PlatformSettingsOverviewPage() {
  const t = await getTranslations("SettingsOverview");
  const tCommon = await getTranslations("Common");
  const locale = (await getLocale()) as AppLocale;

  const cards = [
    {
      title: t("theme.title"),
      description: t("theme.description"),
      href: "/platform/settings/theme",
      icon: Palette,
    },
    // TODO: disabled until we implement profile photo
    // {
    //   title: t("profilePhoto.title"),
    //   description: t("profilePhoto.description"),
    //   href: "/platform/settings/profile-photo",
    //   icon: ImageIcon,
    // },
    {
      title: t("email.title"),
      description: t("email.description"),
      href: "/platform/settings/change-email",
      icon: Mail,
    },
    {
      title: t("password.title"),
      description: t("password.description"),
      href: "/platform/settings/change-password",
      icon: KeyRound,
    },
    {
      title: t("twoFactorAuth.title"),
      description: t("twoFactorAuth.description"),
      href: "/platform/settings/2fa",
      icon: LockKeyhole,
    },
    {
      title: t("security.title"),
      description: t("security.description"),
      href: "/platform/settings/security",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("platformEyebrow")}
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/platform/settings/security">
                {t("actions.securityStatus")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/platform/settings/2fa">
                {t("actions.enable2fa")}
              </Link>
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
                        <p
                          className={cn(
                            "text-sm text-muted-foreground",
                            locale === "my" && "mt-1",
                          )}
                        >
                          {card.description}
                        </p>
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
                  <p className="text-sm text-muted-foreground">
                    {t("language.description")}
                  </p>
                </div>
              </div>
              <LocaleSwitcher className="self-start md:self-center" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("securitySnapshot.title")}</CardTitle>
              <CardDescription>
                {t("securitySnapshot.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">
                    {t("securitySnapshot.twoFactor.title")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("securitySnapshot.twoFactor.description")}
                  </p>
                </div>
                <Badge variant="outline">
                  {t("securitySnapshot.recommended")}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">
                    {t("securitySnapshot.password.title")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("securitySnapshot.password.description")}
                  </p>
                </div>
                <Badge variant="default">{t("securitySnapshot.good")}</Badge>
              </div>
              <Button asChild className="w-full">
                <Link href="/platform/settings/security">
                  {t("securitySnapshot.reviewSecurity")}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("quickUpdates.title")}</CardTitle>
              <CardDescription>{t("quickUpdates.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* <Button
                asChild
                variant="outline"
                className="w-full justify-between"
              >
                <Link href="/platform/settings/profile-photo">
                  {t("quickUpdates.updateProfilePhoto")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button> */}
              <Button
                asChild
                variant="outline"
                className="w-full justify-between"
              >
                <Link href="/platform/settings/change-email">
                  {t("quickUpdates.changeEmail")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-between"
              >
                <Link href="/platform/settings/change-password">
                  {t("quickUpdates.changePassword")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
