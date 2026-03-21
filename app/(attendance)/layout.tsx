import { AppShell } from "@/components/shared/app-shell";

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
