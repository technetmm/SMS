import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/auth";
import { TwoFactor } from "@/components/settings/two-factor";

export default async function TwoFactorPage() {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Security
        </p>
        <h2 className="text-2xl font-semibold">Two-Factor Authentication</h2>
        <p className="text-sm text-muted-foreground">
          Secure your account with an authenticator app.
        </p>
      </div>
      <TwoFactor enabled={user.twoFactorEnabled} />
    </div>
  );
}
