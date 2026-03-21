import { AppShell } from "@/components/shared/app-shell";

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
