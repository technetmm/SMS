import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { UserRole } from "@/app/generated/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TeacherTable } from "@/components/teachers/teacher-table";

export default async function TeachersPage() {
  await requireRole([UserRole.ADMIN]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Create and manage teacher accounts."
        actions={
          <Button asChild>
            <Link href="/teachers/create">New Teacher</Link>
          </Button>
        }
      />
      <TeacherTable />
    </div>
  );
}
