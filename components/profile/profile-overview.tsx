import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dateFormatter } from "@/lib/formatter";
import { enumLabel, USER_ROLE_LABELS } from "@/lib/enum-labels";
import { getLocale } from "next-intl/server";

type DetailItem = {
  label: string;
  value: string;
};

type StatItem = {
  label: string;
  value: string;
};

type SchoolInfo = {
  name: string;
  slug: string;
  currency: string;
  billingDayOfMonth: number;
  isActive: boolean;
  plan?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type ProfileOverviewProps = {
  heading: string;
  description: string;
  settingsBasePath?: string | null;
  user: {
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  };
  accountDetails?: DetailItem[];
  profileDetails?: DetailItem[];
  stats?: StatItem[];
  schoolInfo?: SchoolInfo | null;
};

function buildInitials(name: string | null, email: string) {
  const source = name?.trim() || email.trim();
  return (
    source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "ME"
  );
}

function DetailGrid({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: DetailItem[];
}) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 font-medium">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StatsGrid({ items }: { items: StatItem[] }) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary Stats</CardTitle>
        <CardDescription>Useful counts related to your role.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export async function ProfileOverview({
  heading,
  description,
  settingsBasePath,
  user,
  accountDetails = [],
  profileDetails = [],
  stats = [],
  schoolInfo,
}: ProfileOverviewProps) {
  const locale = await getLocale();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Profile
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{heading}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current User</CardTitle>
            <CardDescription>Your active account identity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name ?? user.email}
                />
                <AvatarFallback>
                  {buildInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <p className="text-xl font-semibold">
                  {user.name?.trim() || "Unnamed User"}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge variant="outline">
                  {enumLabel(user.role, USER_ROLE_LABELS)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {settingsBasePath ? (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common profile and account updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* TODO: disabled until we implement profile photo */}
                {/* <Button
                  asChild
                  variant="outline"
                  className="w-full justify-between"
                >
                  <Link href={`${settingsBasePath}/profile-photo`}>
                    Update profile photo
                  </Link>
                </Button> */}
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-between"
                >
                  <Link href={`${settingsBasePath}/change-email`}>
                    Change email
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-between"
                >
                  <Link href={`${settingsBasePath}/change-password`}>
                    Change password
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {schoolInfo ? (
        <Card>
          <CardHeader>
            <CardTitle>School Info</CardTitle>
            <CardDescription>
              Tenant details for your school workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">School Name</p>
              <p className="font-medium">{schoolInfo.name}</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">Slug</p>
              <p className="font-medium">{schoolInfo.slug}</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">Currency</p>
              <p className="font-medium">{schoolInfo.currency}</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">Billing Day</p>
              <p className="font-medium">Day {schoolInfo.billingDayOfMonth}</p>
            </div>
            {schoolInfo.plan ? (
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="font-medium">{schoolInfo.plan}</p>
              </div>
            ) : null}
            {schoolInfo.createdAt ? (
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium">
                  {dateFormatter(locale).format(schoolInfo.createdAt)}
                </p>
              </div>
            ) : null}
            {schoolInfo.updatedAt ? (
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="font-medium">
                  {dateFormatter(locale).format(schoolInfo.updatedAt)}
                </p>
              </div>
            ) : null}
            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={schoolInfo.isActive ? "default" : "outline"}>
                {schoolInfo.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <DetailGrid
        title="Account Details"
        description="Core account and access information."
        items={accountDetails}
      />

      <DetailGrid
        title="Profile Details"
        description="Information linked to your staff, student, or school profile."
        items={profileDetails}
      />

      <StatsGrid items={stats} />
    </div>
  );
}
