import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getServerAuth } from "@/auth";
import { UserRole } from "@/app/generated/prisma/enums";
import { SignupForm } from "@/components/signup/signup-form";
import { enumLabel, USER_ROLE_LABELS } from "@/lib/enum-labels";

export const metadata: Metadata = {
  title: "Create School Account | Technet SMS",
  description: "Sign up your school and create a secure tenant admin account.",
};

export default function SignupPage() {
  return <SignupPageContent />;
}

async function SignupPageContent() {
  const t = await getTranslations("SignupPage");
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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
      <div className="grid w-full gap-8 md:grid-cols-[1.1fr_1fr] md:items-start">
        <section className="space-y-4 pt-2">
          <p className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            {t("eyebrow")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight leading-relaxed md:text-4xl">
            {t("title")}
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground md:text-base">
            {t("description", {
              role: enumLabel(UserRole.SCHOOL_SUPER_ADMIN, USER_ROLE_LABELS),
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("signIn")}
            </Link>
          </p>
        </section>

        <SignupForm />
      </div>
    </main>
  );
}
