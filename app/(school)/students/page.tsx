import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StudentTable } from "@/components/students/student-table";
import { StudentFilters } from "@/components/students/student-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportMenu } from "@/components/shared/export-menu";
import { exportStudentsToExcel } from "@/app/(school)/exports/actions";
import { StudentStatus } from "@/app/generated/prisma/enums";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireSchoolAdmin();

  const { q, status: paramsStatus } = await searchParams;

  const query = typeof q === "string" ? q : "";
  const status = typeof paramsStatus === "string" ? paramsStatus : "ALL";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Create, manage, and enroll students into classes."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              items={[{ label: "Export Excel", action: exportStudentsToExcel }]}
            />
            <Button asChild>
              <Link href="/students/create">New Student</Link>
            </Button>
          </div>
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
      <StudentTable query={query} status={status as StudentStatus | "ALL"} />
    </div>
  );
}
