import { ThemeToggle } from "@/components/settings/theme-toggle";

export default function PlatformThemeSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Appearance
        </p>
        <h2 className="text-2xl font-semibold">Theme</h2>
        <p className="text-sm text-muted-foreground">
          Choose between system, light, or dark mode.
        </p>
      </div>
      <ThemeToggle />
    </div>
  );
}
