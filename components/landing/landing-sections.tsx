import Link from "next/link";
import { BookOpen, Building2, CheckCircle2, GraduationCap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingHero() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-16 md:py-24">
      <p className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        Built for multi-tenant LMS teams
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
        One platform to run every school in your LMS SaaS.
      </h1>
      <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
        Launch tenant onboarding, manage classrooms, track attendance, and automate billing with a
        clean, secure dashboard your admins and staff can trust.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link href="/signup">Get Started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    </section>
  );
}

export function LandingFeatures() {
  const items = [
    {
      title: "Tenant-Isolated Architecture",
      description: "Each school has strict data isolation with role-based controls.",
      icon: Building2,
    },
    {
      title: "Academic Operations",
      description: "Manage students, staff, sections, and attendance in one workflow.",
      icon: GraduationCap,
    },
    {
      title: "Billing & Subscription Ready",
      description: "Track tuition, plan upgrades, and subscription lifecycle with confidence.",
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
  const plans = [
    { name: "Free", price: "$0", description: "For early-stage schools", points: ["Up to 50 students", "Core dashboard", "Email support"] },
    {
      name: "Basic",
      price: "$49",
      description: "For growing schools",
      points: ["Up to 500 students", "Staff & class workflows", "Attendance & payments"],
    },
    {
      name: "Premium",
      price: "$129",
      description: "For enterprise operations",
      points: ["Unlimited students", "Advanced reports", "Priority support"],
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold md:text-3xl">Simple pricing for every school size</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Start free, then scale when your tenants grow.
        </p>
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
                <Link href="/signup">Choose {plan.name}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-2 px-6 text-sm text-muted-foreground md:flex-row md:items-center">
        <p>© {new Date().getFullYear()} Technet LMS SaaS. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-foreground">
            Login
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            Start Free
          </Link>
        </div>
      </div>
    </footer>
  );
}

