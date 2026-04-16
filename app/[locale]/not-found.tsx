import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { checkRole } from "@/lib/helper";
import { Link } from "@/i18n/navigation";
import { getServerAuth } from "@/auth";

export default async function NotFoundPage() {
  const t = await getTranslations("NotFoundPage");
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
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center px-6 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchX className="h-5 w-5 text-muted-foreground" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/">{t("goHome")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={link}>{t("goDashboard")}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
