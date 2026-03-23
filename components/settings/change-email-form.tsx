"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { changeEmailAction } from "@/app/(school)/settings/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const initialState = { status: "idle" as const };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Updating..." : "Update Email"}
    </Button>
  );
}

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useActionState(changeEmailAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Email updated");
      formRef.current?.reset();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to update email");
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Email</CardTitle>
        <CardDescription>
          Changing your email will be required the next time you sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="current-email">Current email</Label>
            <Input id="current-email" value={currentEmail} readOnly className="bg-muted/40" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-email">New email</Label>
            <Input id="new-email" name="newEmail" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email-password">Confirm password</Label>
            <Input id="email-password" name="password" type="password" required />
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
