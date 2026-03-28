"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { disableTwoFactor } from "@/app/(school)/school/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SecuritySettings({
  lastLogin,
  twoFactorEnabled,
}: {
  lastLogin: string;
  twoFactorEnabled: boolean;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Overview</CardTitle>
        <CardDescription>
          Manage your authentication options and active session controls.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">
              Require a one-time code on every sign in.
            </p>
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
                  <Button variant="outline">Disable</Button>
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
                        const result = await disableTwoFactor({ status: "idle" }, formData);
                        if (result.status === "success") {
                          toast.success(result.message ?? "2FA disabled");
                          setDialogOpen(false);
                          router.refresh();
                          return;
                        }
                        toast.error(result.message ?? "Unable to disable 2FA");
                      });
                    }}
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="disable-password">Confirm password</Label>
                      <Input id="disable-password" name="password" type="password" required />
                    </div>
                    <Button type="submit" disabled={pending}>
                      {pending ? "Disabling..." : "Disable 2FA"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Button variant="outline" onClick={() => router.push("/school/settings/2fa")}>
                Enable
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Last login</p>
            <p className="text-xs text-muted-foreground">{lastLogin}</p>
          </div>
          <Button type="button" variant="outline" disabled>
            View sessions
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Logout from all devices</p>
            <p className="text-xs text-muted-foreground">
              End every active session across your devices.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={logoutPending}
            onClick={() => {
              setLogoutPending(true);
              setTimeout(() => {
                setLogoutPending(false);
                toast.success("Logged out from all devices (mock).");
              }, 800);
            }}
          >
            {logoutPending ? "Working..." : "Logout all"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
