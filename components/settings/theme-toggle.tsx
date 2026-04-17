"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const t = useTranslations("SettingsThemeToggle");
  const { theme, setTheme } = useTheme();
  const currentTheme = theme ?? "system";
  const options = [
    {
      value: "system",
      label: t("options.system.label"),
      description: t("options.system.description"),
      icon: Laptop,
    },
    {
      value: "light",
      label: t("options.light.label"),
      description: t("options.light.description"),
      icon: Sun,
    },
    {
      value: "dark",
      label: t("options.dark.label"),
      description: t("options.dark.description"),
      icon: Moon,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = currentTheme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={cn(
                "group flex flex-col items-start gap-3 rounded-2xl border px-4 py-4 text-left transition",
                isActive
                  ? "border-primary/50 bg-primary/10 shadow-sm"
                  : "border-border/70 hover:border-primary/40 hover:bg-muted/30",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border bg-background text-muted-foreground",
                  isActive && "border-primary/40 text-primary",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
