"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  resendSignupEmailCodeAction,
  verifySignupEmailAction,
  type VerifyEmailActionState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: VerifyEmailActionState = {
  status: "idle",
};

export function VerifyEmailForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [verifyState, verifyAction] = useActionState(
    verifySignupEmailAction,
    initialState,
  );
  const [resendState, resendAction] = useActionState(
    resendSignupEmailCodeAction,
    initialState,
  );

  useEffect(() => {
    if (verifyState.status === "success") {
      toast.success(verifyState.message ?? "Email verified.");
      if (verifyState.redirectTo) {
        router.push(verifyState.redirectTo);
      }
      return;
    }

    if (verifyState.status === "error" && verifyState.message) {
      toast.error(verifyState.message);
    }
  }, [router, verifyState]);

  useEffect(() => {
    if (resendState.status === "success" && resendState.message) {
      toast.success(resendState.message);
      return;
    }

    if (resendState.status === "error") {
      const suffix = resendState.cooldownSeconds
        ? ` (${resendState.cooldownSeconds}s)`
        : "";
      toast.error(
        `${resendState.message ?? "Unable to resend code."}${suffix}`,
      );
    }
  }, [resendState]);

  return (
    <div className="space-y-5">
      <form action={verifyAction} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="verify-email">Email</Label>
          <Input
            id="verify-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="verify-code">Verification Code</Label>
          <Input
            id="verify-code"
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="123456"
            required
          />
        </div>

        <Button type="submit" className="w-full">
          Verify Email
        </Button>
      </form>

      <form action={resendAction} className="space-y-3">
        <input type="hidden" name="email" value={email} readOnly />
        <Button type="submit" variant="outline" className="w-full">
          Resend Code
        </Button>
      </form>
    </div>
  );
}
