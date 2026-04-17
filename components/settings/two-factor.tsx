"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  disableTwoFactor,
  startTwoFactorSetup,
  verifyTwoFactorSetup,
} from "@/app/(school)/school/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

const initialState = { status: "idle" as const };

export function TwoFactor({ enabled }: { enabled: boolean }) {
  const t = useTranslations("SettingsTwoFactor");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled ? (
          <div className="space-y-3">
            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
              {t("enabledBanner")}
            </div>
            <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">{t("disable.button")}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("disable.dialogTitle")}</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    startTransition(async () => {
                      const result = await disableTwoFactor(initialState, formData);
                      if (result.status === "success") {
                        toast.success(result.message ?? t("messages.disabled"));
                        setDisableDialogOpen(false);
                        router.refresh();
                        return;
                      }
                      toast.error(result.message ?? t("messages.failed"));
                    });
                  }}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="password">{t("disable.confirmPassword")}</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? t("disable.disabling") : t("disable.submit")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await startTwoFactorSetup();
                  if (result.status === "success") {
                    setQrCode(result.qrCode ?? null);
                    toast.success(result.message ?? t("messages.scanQr"));
                  } else {
                    toast.error(result.message ?? t("messages.unableToStart"));
                  }
                });
              }}
            >
              {t("enable.button")}
            </Button>

            {qrCode ? (
              <div className="space-y-4">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <Image
                    src={qrCode}
                    alt={t("enable.qrAlt")}
                    width={160}
                    height={160}
                    className="mx-auto h-40 w-40"
                    unoptimized
                  />
                </div>
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    startTransition(async () => {
                      const result = await verifyTwoFactorSetup(initialState, formData);
                      if (result.status === "success") {
                        toast.success(result.message ?? t("messages.enabled"));
                        setQrCode(null);
                        router.refresh();
                        return;
                      }
                      toast.error(result.message ?? t("messages.failed"));
                    });
                  }}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="token">{t("enable.tokenLabel")}</Label>
                    <Input id="token" name="token" inputMode="numeric" required />
                  </div>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? t("enable.verifying") : t("enable.verify")}
                  </Button>
                </form>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
