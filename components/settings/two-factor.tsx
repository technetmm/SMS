"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  disableTwoFactor,
  startTwoFactorSetup,
  verifyTwoFactorSetup,
} from "@/app/(school)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { status: "idle" as const };

export function TwoFactor({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);

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
            <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Disable 2FA</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disable 2FA</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    startTransition(async () => {
                      const result = await disableTwoFactor(initialState, formData);
                      if (result.status === "success") {
                        toast.success(result.message ?? "2FA disabled");
                        setDisableDialogOpen(false);
                        router.refresh();
                        return;
                      }
                      toast.error(result.message ?? "Failed");
                    });
                  }}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="password">Confirm password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Disabling..." : "Disable"}
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
                  <Image
                    src={qrCode}
                    alt="2FA QR code"
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
                        toast.success(result.message ?? "2FA enabled");
                        setQrCode(null);
                        router.refresh();
                        return;
                      }
                      toast.error(result.message ?? "Failed");
                    });
                  }}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="token">Enter the 6-digit code</Label>
                    <Input id="token" name="token" inputMode="numeric" required />
                  </div>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Verifying..." : "Verify & Enable"}
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
