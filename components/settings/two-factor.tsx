"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import {
  disableTwoFactor,
  startTwoFactorSetup,
  verifyTwoFactorSetup,
} from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { status: "idle" as const };

export function TwoFactor({ enabled }: { enabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verifyState, verifyAction] = useActionState(
    verifyTwoFactorSetup,
    initialState,
  );
  const [disableState, disableAction] = useActionState(
    disableTwoFactor,
    initialState,
  );

  useEffect(() => {
    if (verifyState.status === "success") {
      toast.success(verifyState.message ?? "2FA enabled");
      setQrCode(null);
    }
    if (verifyState.status === "error") toast.error(verifyState.message ?? "Failed");
  }, [verifyState]);

  useEffect(() => {
    if (disableState.status === "success") toast.success(disableState.message ?? "2FA disabled");
    if (disableState.status === "error") toast.error(disableState.message ?? "Failed");
  }, [disableState]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Secure your account with a time-based one-time password (TOTP).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled ? (
          <div className="space-y-3">
            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
              2FA is currently enabled for your account.
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Disable 2FA</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disable 2FA</DialogTitle>
                </DialogHeader>
                <form action={disableAction} className="space-y-3">
                  <div className="grid gap-2">
                    <Label htmlFor="password">Confirm password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <Button type="submit">Disable</Button>
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
                    toast.success(result.message ?? "Scan the QR code");
                  } else {
                    toast.error(result.message ?? "Unable to start 2FA");
                  }
                });
              }}
            >
              Enable 2FA
            </Button>

            {qrCode ? (
              <div className="space-y-4">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <img src={qrCode} alt="2FA QR code" className="mx-auto h-40 w-40" />
                </div>
                <form action={verifyAction} className="space-y-3">
                  <div className="grid gap-2">
                    <Label htmlFor="token">Enter the 6-digit code</Label>
                    <Input id="token" name="token" inputMode="numeric" required />
                  </div>
                  <Button type="submit">Verify & Enable</Button>
                </form>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
