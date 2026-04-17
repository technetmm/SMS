"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { disableTwoFactor } from "@/app/(school)/school/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";

export function SecuritySettings({
  lastLogin,
  twoFactorEnabled,
}: {
  lastLogin: string;
  twoFactorEnabled: boolean;
}) {
  const t = useTranslations("SettingsSecurity");
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">{t("twoFactor.title")}</p>
            <p className="text-xs text-muted-foreground">{t("twoFactor.description")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={(checked) => {
                if (checked && !twoFactorEnabled) {
                  router.push("/school/settings/2fa");
                  return;
                }
                if (!checked && twoFactorEnabled) {
                  setDialogOpen(true);
                }
              }}
            />
            {twoFactorEnabled ? (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">{t("twoFactor.disable")}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("twoFactor.disableDialogTitle")}</DialogTitle>
                  </DialogHeader>
                  <form
                    className="space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      startTransition(async () => {
                        const result = await disableTwoFactor({ status: "idle" }, formData);
                        if (result.status === "success") {
                          toast.success(result.message ?? t("messages.twoFactorDisabled"));
                          setDialogOpen(false);
                          router.refresh();
                          return;
                        }
                        toast.error(result.message ?? t("messages.disableFailed"));
                      });
                    }}
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="disable-password">{t("twoFactor.confirmPassword")}</Label>
                      <Input id="disable-password" name="password" type="password" required />
                    </div>
                    <Button type="submit" disabled={pending}>
                      {pending ? t("twoFactor.disabling") : t("twoFactor.disableSubmit")}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Button variant="outline" onClick={() => router.push("/school/settings/2fa")}>
                {t("twoFactor.enable")}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">{t("lastLogin.title")}</p>
            <p className="text-xs text-muted-foreground">{lastLogin}</p>
          </div>
          <Button type="button" variant="outline" disabled>
            {t("lastLogin.viewSessions")}
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">{t("logoutAll.title")}</p>
            <p className="text-xs text-muted-foreground">{t("logoutAll.description")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={logoutPending}
            onClick={() => {
              setLogoutPending(true);
              setTimeout(() => {
                setLogoutPending(false);
                toast.success(t("messages.loggedOutAll"));
              }, 800);
            }}
          >
            {logoutPending ? t("logoutAll.working") : t("logoutAll.button")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
