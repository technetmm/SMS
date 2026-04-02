"use client";

import { useActionState, useEffect, useState } from "react";
import { RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  resendSignupEmailCodeAction,
  verifySignupEmailAction,
  type VerifyEmailActionState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import { REGEXP_ONLY_DIGITS } from "input-otp";

const initialState: VerifyEmailActionState = { status: "idle" };

export function VerifyEmailForm({
  initialEmail,
  emailSendFailed = false,
}: {
  initialEmail: string;
  emailSendFailed?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
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
      {emailSendFailed ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          We created your account, but we could not send the verification code.
          Please click <span className="font-medium">Resend Code</span>.
        </div>
      ) : null}

      <form action={verifyAction} className="space-y-5">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="verify-code">Verification Code</Label>
            <Button
              type="submit"
              form="resend-code-form"
              variant={emailSendFailed ? "default" : "outline"}
              size="xs"
            >
              <RefreshCwIcon />
              {emailSendFailed ? "Resend Now" : "Resend"}
            </Button>
          </div>
          <InputOTP
            id="verify-code"
            name="code"
            value={code}
            onChange={setCode}
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            required
            autoComplete="one-time-code"
          >
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-11 *:data-[slot=input-otp-slot]:w-10 *:data-[slot=input-otp-slot]:text-base sm:*:data-[slot=input-otp-slot]:h-12 sm:*:data-[slot=input-otp-slot]:w-11 sm:*:data-[slot=input-otp-slot]:text-lg">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator className="mx-2" />
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-11 *:data-[slot=input-otp-slot]:w-10 *:data-[slot=input-otp-slot]:text-base sm:*:data-[slot=input-otp-slot]:h-12 sm:*:data-[slot=input-otp-slot]:w-11 sm:*:data-[slot=input-otp-slot]:text-lg">
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button type="submit" className="w-full">
          Verify Email
        </Button>
      </form>

      <form id="resend-code-form" action={resendAction}>
        <input type="hidden" name="email" value={email} readOnly />
      </form>
    </div>
  );
}
