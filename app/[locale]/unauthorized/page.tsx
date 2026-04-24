import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServerAuth } from "@/auth";
import { checkRole } from "@/lib/helper";
import { Link } from "@/i18n/navigation";

export default async function UnauthorizedPage() {
  const t = await getTranslations("UnauthorizedPage");
  const session = await getServerAuth();

  const link = session
    ? checkRole(session.user, "SUPER_ADMIN")
      ? "/platform/dashboard"
      : checkRole(session.user, "SCHOOL_ADMIN")
        ? "/school/dashboard"
        : checkRole(session.user, "TEACHER")
          ? "/teacher/dashboard"
          : checkRole(session.user, "STUDENT")
            ? "/student/dashboard"
        : "/login"
    : "/login";

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("description")}</p>
          <Button asChild>
            <Link href={link}>{t("goDashboard")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
