import { AppShell } from "@/components/shared/app-shell";

export default function TeachersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
