"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { changePasswordAction } from "@/app/(dashboard)/settings/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const initialState = { status: "idle" as const };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Updating..." : "Update Password"}
    </Button>
  );
}

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(changePasswordAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Password updated");
      formRef.current?.reset();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to update password");
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Choose a strong password you do not use anywhere else.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" name="currentPassword" type="password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" name="newPassword" type="password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
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
