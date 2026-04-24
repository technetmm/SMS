"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  DEVICE_APPROVAL_DENIED_CODE,
  DEVICE_APPROVAL_DENIED_MESSAGE,
  DEVICE_APPROVAL_EXPIRED_CODE,
  DEVICE_APPROVAL_EXPIRED_MESSAGE,
} from "@/lib/auth/device-approval";
import {
  TWO_FACTOR_INVALID_CODE,
  TWO_FACTOR_REQUIRED_CODE,
} from "@/lib/auth/2fa";
import {
  clearPendingLoginCredentials,
  readPendingLoginCredentials,
  savePendingLoginCredentials,
  type PendingLoginCredentials,
} from "@/lib/auth/pending-login";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

export function TwoFactorLoginForm({
  initialApprovalToken,
}: {
  initialApprovalToken: string | null;
}) {
  const router = useRouter();
  const t = useTranslations("TwoFactorForm");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const credentials = useMemo<PendingLoginCredentials | null>(() => {
    const pending = readPendingLoginCredentials();
    if (!pending) return null;
    const next = {
      ...pending,
      approvalToken: initialApprovalToken ?? pending.approvalToken,
    };
    savePendingLoginCredentials(next);
    return next;
  }, [initialApprovalToken]);
  const displayError =
    error ?? (!credentials ? t("messages.sessionExpired") : null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const pending = credentials ?? readPendingLoginCredentials();
    if (!pending) {
      setError(t("messages.sessionExpired"));
      toast.error(t("messages.sessionExpired"));
      router.replace("/login");
      return;
    }

    if (code.length !== 6) {
      setError(t("messages.codeLength"));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email: pending.email,
      password: pending.password,
      approvalToken: pending.approvalToken ?? undefined,
      twoFactorToken: code,
      redirect: false,
      callbackUrl: "/",
    });

    if (result?.error) {
      if (result.error === TWO_FACTOR_REQUIRED_CODE) {
        const message = t("messages.codeRequired");
        setError(message);
        toast.error(message);
        setIsSubmitting(false);
        return;
      }

      if (result.error === TWO_FACTOR_INVALID_CODE) {
        const message = t("messages.invalidCode");
        setError(message);
        toast.error(message);
        setCode("");
        setIsSubmitting(false);
        return;
      }

      if (result.error === DEVICE_APPROVAL_DENIED_CODE) {
        setError(DEVICE_APPROVAL_DENIED_MESSAGE);
        toast.error(DEVICE_APPROVAL_DENIED_MESSAGE);
        clearPendingLoginCredentials();
        setIsSubmitting(false);
        router.replace("/login");
        return;
      }

      if (result.error === DEVICE_APPROVAL_EXPIRED_CODE) {
        setError(DEVICE_APPROVAL_EXPIRED_MESSAGE);
        toast.error(DEVICE_APPROVAL_EXPIRED_MESSAGE);
        clearPendingLoginCredentials();
        setIsSubmitting(false);
        router.replace("/login");
        return;
      }

      setError(t("messages.signInFailed"));
      toast.error(t("messages.signInFailed"));
      setIsSubmitting(false);
      return;
    }

    clearPendingLoginCredentials();
    toast.success(t("messages.signInSuccess"));
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="two-factor-code">{t("fields.code")}</Label>
        <InputOTP
          id="two-factor-code"
          name="twoFactorToken"
          value={code}
          onChange={setCode}
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          inputMode="numeric"
          required
          autoComplete="one-time-code"
          disabled={isSubmitting}
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

      {displayError ? (
        <p className="text-sm text-destructive">{displayError}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("buttons.verifying") : t("buttons.submit")}
      </Button>
    </form>
  );
}
