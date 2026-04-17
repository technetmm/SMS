"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { changePasswordAction } from "@/app/(school)/school/settings/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const initialState = { status: "idle" as const };

function SubmitButton() {
  const t = useTranslations("SettingsChangePasswordForm");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("buttons.updating") : t("buttons.submit")}
    </Button>
  );
}

export function ChangePasswordForm() {
  const t = useTranslations("SettingsChangePasswordForm");
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(changePasswordAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? t("messages.updated"));
      formRef.current?.reset();
    }
    if (state.status === "error") {
      toast.error(state.message ?? t("messages.updateFailed"));
    }
  }, [state, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="current-password">{t("fields.currentPassword")}</Label>
            <Input id="current-password" name="currentPassword" type="password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">{t("fields.newPassword")}</Label>
            <Input id="new-password" name="newPassword" type="password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">{t("fields.confirmPassword")}</Label>
            <Input id="confirm-password" name="confirmPassword" type="password" required />
          </div>
          <SubmitButton />
          {state.status === "error" ? (
            <p className="text-sm text-destructive" role="status">
              {state.message}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
