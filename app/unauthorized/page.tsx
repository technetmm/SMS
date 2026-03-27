import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServerAuth } from "@/auth";
import { checkRole } from "@/lib/helper";

export default async function UnauthorizedPage() {
  const session = await getServerAuth();

  const link = session
    ? checkRole(session.user, "SUPER_ADMIN")
      ? "/platform/dashboard"
      : checkRole(session.user, "SCHOOL_ADMIN") ||
          checkRole(session.user, "STAFF")
        ? "/dashboard"
        : "/login"
    : "/login";

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You do not have permission to access this page.
          </p>
          <Button asChild>
            <Link href={link}>Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
