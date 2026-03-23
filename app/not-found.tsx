import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { checkRole } from "@/lib/helper";
import { getServerAuth } from "@/auth";

export default async function NotFoundPage() {
  const session = await getServerAuth();

  const link = session
    ? checkRole(session.user, "SUPER_ADMIN")
      ? "/platform/dashboard"
      : checkRole(session.user, "SCHOOL_ADMIN") ||
          checkRole(session.user, "TEACHER")
        ? "/dashboard"
        : "/login"
    : "/login";

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center px-6 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchX className="h-5 w-5 text-muted-foreground" />
            Page Not Found
          </CardTitle>
          <CardDescription>
            The page you are looking for does not exist or may have been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/">Go to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={link}>Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
