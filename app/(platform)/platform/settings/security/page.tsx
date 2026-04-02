import { redirect } from "next/navigation";
import { getServerAuth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SecuritySettings } from "@/components/settings/security-settings";

function formatLastLogin(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function PlatformSecurityPage() {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true, updatedAt: true },
  });

  if (!user) {
    redirect("/login");
  }

  const lastLogin = formatLastLogin(user.updatedAt ?? new Date());

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Security
        </p>
        <h2 className="text-2xl font-semibold">Account Security</h2>
        <p className="text-sm text-muted-foreground">
          Control sign-in protections and session visibility.
        </p>
      </div>
      <SecuritySettings
        lastLogin={lastLogin}
        twoFactorEnabled={user.twoFactorEnabled}
      />
    </div>
  );
}
