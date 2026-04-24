"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  resetStaffPassword,
  resetStaffTwoFactor,
  type StaffActionState,
} from "@/app/(school)/school/staff/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: StaffActionState = { status: "idle" };

export function StaffSecurityActions({
  targetUserId,
}: {
  targetUserId: string;
}) {
  const t = useTranslations("SchoolEntities.staff.table.securityActions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const runResetTwoFactor = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("targetUserId", targetUserId);
      const result = await resetStaffTwoFactor(initialState, formData);

      if (result.status === "success") {
        toast.success(result.message ?? t("messages.twoFactorReset"));
        router.refresh();
        return;
      }

      toast.error(result.message ?? t("messages.twoFactorResetFailed"));
    });
  };

  const runResetPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set("targetUserId", targetUserId);

    startTransition(async () => {
      const result = await resetStaffPassword(initialState, formData);

      if (result.status === "success") {
        toast.success(result.message ?? t("messages.passwordReset"));
        setPasswordDialogOpen(false);
        router.refresh();
        return;
      }

      toast.error(result.message ?? t("messages.passwordResetFailed"));
    });
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={runResetTwoFactor}
      >
        {t("buttons.resetTwoFactor")}
      </Button>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" size="sm" variant="secondary" disabled={pending}>
            {t("buttons.resetPassword")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialog.title")}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={runResetPassword}>
            <div className="grid gap-2">
              <Label htmlFor={`new-password-${targetUserId}`}>
                {t("dialog.newPassword")}
              </Label>
              <Input
                id={`new-password-${targetUserId}`}
                name="newPassword"
                type="password"
                minLength={8}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`confirm-password-${targetUserId}`}>
                {t("dialog.confirmPassword")}
              </Label>
              <Input
                id={`confirm-password-${targetUserId}`}
                name="confirmPassword"
                type="password"
                minLength={8}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
              >
                {t("dialog.cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? t("dialog.submitting") : t("dialog.submit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
