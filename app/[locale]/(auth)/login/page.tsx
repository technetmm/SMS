"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  DEVICE_APPROVAL_DENIED_CODE,
  DEVICE_APPROVAL_DENIED_MESSAGE,
  DEVICE_APPROVAL_EXPIRED_CODE,
  DEVICE_APPROVAL_EXPIRED_MESSAGE,
  DEVICE_APPROVAL_POLL_INTERVAL_MS,
  DEVICE_APPROVAL_REQUIRED_MESSAGE,
  extractDeviceApprovalToken,
} from "@/lib/auth/device-approval";
import {
  EMAIL_NOT_VERIFIED_CODE,
  EMAIL_NOT_VERIFIED_MESSAGE,
} from "@/lib/auth/email-verification";
import {
  SESSION_LOCK_ERROR_CODE,
  SESSION_LOCK_ERROR_MESSAGE,
} from "@/lib/auth/session-lock";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("LoginPage");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalToken, setApprovalToken] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const lastCredentialsRef = useRef<{ email: string; password: string } | null>(
    null,
  );

  async function attemptSignIn(
    email: string,
    password: string,
    token?: string,
  ) {
    return signIn("credentials", {
      email,
      password,
      approvalToken: token,
      redirect: false,
      callbackUrl: "/",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setUnverifiedEmail(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    lastCredentialsRef.current = { email, password };

    const result = await attemptSignIn(email, password);

    if (result?.error) {
      if (result.error === EMAIL_NOT_VERIFIED_CODE) {
        setUnverifiedEmail(email);
        setError(EMAIL_NOT_VERIFIED_MESSAGE);
        toast.error(EMAIL_NOT_VERIFIED_MESSAGE);
        setIsSubmitting(false);
        return;
      }

      const deviceApprovalToken = extractDeviceApprovalToken(result.error);
      if (deviceApprovalToken) {
        setApprovalToken(deviceApprovalToken);
        setError(DEVICE_APPROVAL_REQUIRED_MESSAGE);
        toast.message(DEVICE_APPROVAL_REQUIRED_MESSAGE);
        setIsSubmitting(false);
        return;
      }

      if (result.error === DEVICE_APPROVAL_DENIED_CODE) {
        setError(DEVICE_APPROVAL_DENIED_MESSAGE);
        toast.error(DEVICE_APPROVAL_DENIED_MESSAGE);
        setIsSubmitting(false);
        return;
      }

      if (result.error === DEVICE_APPROVAL_EXPIRED_CODE) {
        setError(DEVICE_APPROVAL_EXPIRED_MESSAGE);
        toast.error(DEVICE_APPROVAL_EXPIRED_MESSAGE);
        setIsSubmitting(false);
        return;
      }

      const isSessionLocked =
        result.error === SESSION_LOCK_ERROR_CODE ||
        result.error.includes(SESSION_LOCK_ERROR_CODE);
      const message = isSessionLocked
        ? SESSION_LOCK_ERROR_MESSAGE
        : t("messages.invalidCredentials");

      setUnverifiedEmail(null);
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    toast.success(t("messages.signInSuccess"));
    setUnverifiedEmail(null);
    setApprovalToken(null);
    router.push("/");
  }

  useEffect(() => {
    if (!approvalToken) return;

    let active = true;
    const checkApproval = async () => {
      const credentials = lastCredentialsRef.current;
      if (!credentials || !active) return;

      const response = await fetch(
        `/api/auth/device-approvals/status?token=${encodeURIComponent(approvalToken)}`,
        { cache: "no-store" },
      ).catch(() => null);

      if (!response || !active) return;
      const data = (await response.json().catch(() => null)) as {
        status?: string;
      } | null;
      const status = data?.status;

      if (status === "PENDING") return;

      if (status === "APPROVED") {
        const result = await attemptSignIn(
          credentials.email,
          credentials.password,
          approvalToken,
        );

        if (result?.error) {
          if (result.error === DEVICE_APPROVAL_DENIED_CODE) {
            setError(DEVICE_APPROVAL_DENIED_MESSAGE);
            toast.error(DEVICE_APPROVAL_DENIED_MESSAGE);
          } else if (result.error === DEVICE_APPROVAL_EXPIRED_CODE) {
            setError(DEVICE_APPROVAL_EXPIRED_MESSAGE);
            toast.error(DEVICE_APPROVAL_EXPIRED_MESSAGE);
          } else {
            setError(t("messages.finishFailed"));
            toast.error(t("messages.finishFailed"));
          }
          setApprovalToken(null);
          return;
        }

        toast.success(t("messages.signInSuccess"));
        setApprovalToken(null);
        router.push("/");
        return;
      }

      if (status === "DENIED") {
        setError(DEVICE_APPROVAL_DENIED_MESSAGE);
        toast.error(DEVICE_APPROVAL_DENIED_MESSAGE);
      } else if (status === "INVALID") {
        setError(t("messages.deviceInvalid"));
        toast.error(t("messages.deviceInvalid"));
      } else {
        setError(DEVICE_APPROVAL_EXPIRED_MESSAGE);
        toast.error(DEVICE_APPROVAL_EXPIRED_MESSAGE);
      }
      setApprovalToken(null);
    };

    const intervalId = window.setInterval(() => {
      void checkApproval();
    }, DEVICE_APPROVAL_POLL_INTERVAL_MS);

    void checkApproval();

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [approvalToken, router, t]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">{t("fields.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t("fields.password")}</Label>
            <InputGroup>
              <InputGroupInput
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                disabled={isSubmitting}
                className="pr-10"
              />

              <InputGroupAddon align={"inline-end"}>
                <InputGroupButton
                  type="button"
                  aria-label={
                    showPassword
                      ? t("fields.hidePassword")
                      : t("fields.showPassword")
                  }
                  size="icon-xs"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {unverifiedEmail ? (
            <p className="text-sm text-muted-foreground">
              {t("verifyPrompt")}{" "}
              <Link
                href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("verifyLink")}
              </Link>
            </p>
          ) : null}
          <Button
            type="submit"
            className={"w-full"}
            disabled={isSubmitting || Boolean(approvalToken)}
          >
            {isSubmitting
              ? t("buttons.signingIn")
              : approvalToken
                ? t("buttons.waitingApproval")
                : t("buttons.submit")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("signupPrompt")}{" "}
            <Link
              href="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("signupLink")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
