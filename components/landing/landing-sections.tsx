import Link from "next/link";
import { BookOpen, Building2, CheckCircle2, GraduationCap, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingHero() {
  const t = useTranslations("LandingHero");

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-16 md:py-24">
      <p className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        {t("eyebrow")}
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
        {t("title")}
      </h1>
      <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
        {t("description")}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link href="/signup">{t("primaryAction")}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">{t("secondaryAction")}</Link>
        </Button>
      </div>
    </section>
  );
}

export function LandingFeatures() {
  const t = useTranslations("LandingFeatures");
  const items = [
    {
      title: t("items.0.title"),
      description: t("items.0.description"),
      icon: Building2,
    },
    {
      title: t("items.1.title"),
      description: t("items.1.description"),
      icon: GraduationCap,
    },
    {
      title: t("items.2.title"),
      description: t("items.2.description"),
      icon: BookOpen,
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map(({ title, description, icon: Icon }) => (
          <Card key={title} className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className="h-5 w-5 text-primary" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function LandingPricing() {
  const t = useTranslations("LandingPricing");
  const plans = [
    {
      name: t("plans.free.name"),
      price: "$0",
      description: t("plans.free.description"),
      points: [
        t("plans.free.points.0"),
        t("plans.free.points.1"),
        t("plans.free.points.2"),
      ],
    },
    {
      name: t("plans.basic.name"),
      price: "$49",
      description: t("plans.basic.description"),
      points: [
        t("plans.basic.points.0"),
        t("plans.basic.points.1"),
        t("plans.basic.points.2"),
      ],
    },
    {
      name: t("plans.premium.name"),
      price: "$129",
      description: t("plans.premium.description"),
      points: [
        t("plans.premium.points.0"),
        t("plans.premium.points.1"),
        t("plans.premium.points.2"),
      ],
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold md:text-3xl">{t("title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-baseline justify-between">
                <span>{plan.name}</span>
                <span className="text-2xl">{plan.price}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {plan.points.map((point) => (
                <div key={point} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{point}</span>
                </div>
              ))}
              <Button asChild className="mt-4 w-full">
                <Link href="/signup">{t("choosePlan", { plan: plan.name })}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t border-border/60 py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-2 px-6 text-sm text-muted-foreground md:flex-row md:items-center">
        <p>{t("copyright", { year: new Date().getFullYear() })}</p>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-foreground">
            {t("login")}
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            {t("startFree")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
