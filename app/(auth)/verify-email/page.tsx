import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; emailSend?: string }>;
}) {
  const t = await getTranslations("VerifyEmailPage");
  const params = await searchParams;
  const initialEmail =
    typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
  const emailSendFailed = params.emailSend === "failed";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <VerifyEmailForm
          initialEmail={initialEmail}
          emailSendFailed={emailSendFailed}
        />
        <p className="text-center text-sm text-muted-foreground">
          {t("alreadyVerified")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
