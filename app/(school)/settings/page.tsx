import Link from "next/link";
import {
  ArrowRight,
  Image as ImageIcon,
  KeyRound,
  LockKeyhole,
  Mail,
  Palette,
  Shield,
  ShieldCheck,
  ShieldEllipsis,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    title: "Roles",
    description: "Create and manage staff roles for your school.",
    href: "/settings/roles",
    icon: Shield,
  },
  {
    title: "Permissions",
    description: "Manage the permission matrix for all roles.",
    href: "/settings/permissions",
    icon: ShieldEllipsis,
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
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Settings
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Account preferences
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile, appearance, and security controls.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/settings/security">
                Security status
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/2fa">Enable 2FA</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>Settings overview</CardTitle>
            <CardDescription>
              Jump straight to the section you want to update.
            </CardDescription>
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
                        <p className="text-sm text-muted-foreground">
                          {card.description}
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline">
                      <Link href={card.href}>
                        Open
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  {index < cards.length - 1 ? <Separator /> : null}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security snapshot</CardTitle>
              <CardDescription>Review your protection status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Two-factor auth</p>
                  <p className="text-xs text-muted-foreground">
                    Add a second verification step.
                  </p>
                </div>
                <Badge variant="outline">Recommended</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">
                    Updated regularly for safety.
                  </p>
                </div>
                <Badge variant="default">Good</Badge>
              </div>
              <Button asChild className="w-full">
                <Link href="/settings/security">Review security</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick updates</CardTitle>
              <CardDescription>Common account changes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/settings/profile-photo">
                  Update profile photo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/settings/change-email">
                  Change email
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/settings/change-password">
                  Change password
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
