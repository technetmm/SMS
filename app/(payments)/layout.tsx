import { AppShell } from "@/components/shared/app-shell";

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
