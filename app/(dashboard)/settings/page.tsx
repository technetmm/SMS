import Link from "next/link";
import {
  ArrowRight,
  Image as ImageIcon,
  KeyRound,
  LockKeyhole,
  Mail,
  Palette,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const cards = [
  {
    title: "Theme",
    description: "Switch between light, dark, or system appearance.",
    href: "/settings/theme",
    icon: Palette,
  },
  {
    title: "Profile Photo",
    description: "Upload or remove your profile picture.",
    href: "/settings/profile-photo",
    icon: ImageIcon,
  },
  {
    title: "Email",
    description: "Update the email used to sign in.",
    href: "/settings/change-email",
    icon: Mail,
  },
  {
    title: "Password",
    description: "Change your account password securely.",
    href: "/settings/change-password",
    icon: KeyRound,
  },
  {
    title: "Two-Factor Auth",
    description: "Enable or disable two-factor authentication.",
    href: "/settings/2fa",
    icon: LockKeyhole,
  },
  {
    title: "Security",
    description: "Review security status and sessions.",
    href: "/settings/security",
    icon: ShieldCheck,
  },
];

export default function SettingsOverviewPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-gradient-to-br from-muted/40 via-background to-background p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Settings
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Manage your account experience
            </h1>
            <p className="text-sm text-muted-foreground">
              Update appearance, profile, authentication, and security from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/settings/security">
                Security Check
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/profile-photo">Update Photo</Link>
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Appearance
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Switch themes and personalize the dashboard tone.
            </p>
          </div>
          <div className="rounded-xl border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Account
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep email and password credentials updated.
            </p>
          </div>
          <div className="rounded-xl border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Security
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Enable 2FA and review session safeguards.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.href}
              className="group border-border/60 transition hover:border-primary/40 hover:shadow-md"
            >
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/40 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={card.href}>
                    Open
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
