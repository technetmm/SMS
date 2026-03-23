import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/auth";
import { ChangeEmailForm } from "@/components/settings/change-email-form";

export default async function ChangeEmailPage() {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </p>
        <h2 className="text-2xl font-semibold">Change Email</h2>
        <p className="text-sm text-muted-foreground">
          Update the email address associated with your account.
        </p>
      </div>
      <ChangeEmailForm currentEmail={user.email} />
    </div>
  );
}
