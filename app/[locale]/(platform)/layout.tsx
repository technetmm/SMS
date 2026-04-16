import { requireSuperAdmin } from "@/lib/permissions";
import { AppShell } from "@/components/shared/app-shell";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();

  return <AppShell>{children}</AppShell>;
}
