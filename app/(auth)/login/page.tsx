"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { SESSION_LOCK_ERROR_CODE, SESSION_LOCK_ERROR_MESSAGE } from "@/lib/auth/session-lock";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalToken, setApprovalToken] = useState<string | null>(null);
  const lastCredentialsRef = useRef<{ email: string; password: string } | null>(null);

  async function attemptSignIn(email: string, password: string, token?: string) {
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
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    lastCredentialsRef.current = { email, password };

    const result = await attemptSignIn(email, password);

    if (result?.error) {
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
        : "Invalid email or password.";

      setError(message);
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    toast.success("Signed in successfully.");
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
      const data = (await response.json().catch(() => null)) as
        | { status?: string }
        | null;
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
            setError("Unable to finish sign in. Please try again.");
            toast.error("Unable to finish sign in. Please try again.");
          }
          setApprovalToken(null);
          return;
        }

        toast.success("Signed in successfully.");
        setApprovalToken(null);
        router.push("/");
        return;
      }

      if (status === "DENIED") {
        setError(DEVICE_APPROVAL_DENIED_MESSAGE);
        toast.error(DEVICE_APPROVAL_DENIED_MESSAGE);
      } else if (status === "INVALID") {
        setError("Login approval request is no longer valid. Please sign in again.");
        toast.error("Login approval request is no longer valid. Please sign in again.");
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
  }, [approvalToken, router]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required disabled={isSubmitting} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || Boolean(approvalToken)}
          >
            {isSubmitting
              ? "Signing in..."
              : approvalToken
                ? "Waiting for approval..."
                : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New school?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Create account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
