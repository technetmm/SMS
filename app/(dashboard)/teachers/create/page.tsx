import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { UserRole } from "@/app/generated/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TeacherForm } from "@/components/teachers/teacher-form";

export default async function CreateTeacherPage() {
  await requireRole([UserRole.ADMIN]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Teacher"
        description="Create a new teacher account and link it to a user."
        actions={
          <Button asChild variant="outline">
            <Link href="/teachers">Back to Teachers</Link>
          </Button>
        }
      />
      <TeacherForm />
    </div>
  );
}
