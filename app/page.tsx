import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/auth";
import { UserRole } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import {
  Footer,
  LandingFeatures,
  LandingHero,
  LandingPricing,
} from "@/components/landing/landing-sections";

export const metadata: Metadata = {
  title: "Technet SMS SaaS | Multi-Tenant School Management",
  description:
    "Run your school operations on one secure platform. Manage students, staff, classes, payments, and reports in minutes.",
};

export default async function HomePage() {
  const session = await getServerAuth();

  if (session?.user?.role === UserRole.SUPER_ADMIN) {
    redirect("/platform/dashboard");
  }

  if (session?.user?.role === UserRole.SCHOOL_SUPER_ADMIN) {
    redirect("/school/dashboard");
  }

  if (session?.user?.role === UserRole.SCHOOL_ADMIN) {
    redirect("/school/dashboard");
  }

  if (session?.user?.role === UserRole.TEACHER) {
    redirect("/teacher/dashboard");
  }

  if (session?.user?.role === UserRole.STUDENT) {
    redirect("/student/dashboard");
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
      <LandingHero />
      <LandingFeatures />
      <LandingPricing />
      <section className="mx-auto w-full max-w-6xl px-6 py-10 text-center md:py-14">
        <h3 className="text-2xl font-semibold">
          Ready to launch your school workspace?
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Create your school account in under two minutes and invite your team.
        </p>
        <Button asChild size="lg" className="mt-5">
          <Link href="/signup">Get Started</Link>
        </Button>
      </section>
      <Footer />
    </main>
  );
}
