import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { UserRole } from "@/app/generated/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StudentTable } from "@/components/students/student-table";
import { StudentFilters } from "@/components/students/student-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  await requireRole([UserRole.ADMIN]);

  const query = typeof searchParams.q === "string" ? searchParams.q : "";
  const status =
    typeof searchParams.status === "string" ? searchParams.status : "ALL";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Create, manage, and enroll students into classes."
        actions={
          <Button asChild>
            <Link href="/students/create">New Student</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentFilters query={query} status={status} />
        </CardContent>
      </Card>
      <StudentTable query={query} status={status as "ACTIVE" | "INACTIVE" | "GRADUATED" | "ALL"} />
    </div>
  );
}
