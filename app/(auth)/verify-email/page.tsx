import Link from "next/link";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const initialEmail =
    typeof params.email === "string" ? params.email.trim().toLowerCase() : "";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to your email to activate your school account.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <VerifyEmailForm initialEmail={initialEmail} />
        <p className="text-center text-sm text-muted-foreground">
          Already verified?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
