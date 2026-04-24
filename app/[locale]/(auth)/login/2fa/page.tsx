import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TwoFactorLoginForm } from "@/components/auth/two-factor-login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TwoFactorPage({
  searchParams,
}: {
  searchParams: Promise<{ approvalToken?: string }>;
}) {
  const t = await getTranslations("TwoFactorPage");
  const params = await searchParams;
  const approvalToken =
    typeof params.approvalToken === "string" && params.approvalToken.trim()
      ? params.approvalToken.trim()
      : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <TwoFactorLoginForm initialApprovalToken={approvalToken} />
        <p className="text-center text-sm text-muted-foreground">
          {t("backToLoginPrompt")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("backToLogin")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
