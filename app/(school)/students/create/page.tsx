import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StudentForm } from "@/components/students/student-form";

export default async function CreateStudentPage() {
  await requireSchoolAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Student"
        description="Add a new student record to the SMS."
        actions={
          <Button asChild variant="outline">
            <Link href="/students">Back to Students</Link>
          </Button>
        }
      />
      <StudentForm mode="create" />
    </div>
  );
}
