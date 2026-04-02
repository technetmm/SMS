export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className="min-w-0 space-y-6">{children}</section>;
}
