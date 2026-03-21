import { AppShell } from "@/components/shared/app-shell";

export default function ClassesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
