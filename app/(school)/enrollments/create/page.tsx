import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EnrollmentCreateForm } from "@/components/enrollments/enrollment-create-form";
import { getEnrollmentFormOptions } from "@/app/(school)/enrollments/actions";
import { requireEnrollmentManager } from "@/lib/permissions";

export default async function CreateEnrollmentPage() {
  await requireEnrollmentManager();

  const { students, sections } = await getEnrollmentFormOptions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Enrollment"
        description="Enroll a student into a section and auto-create the first invoice."
        actions={
          <Button asChild variant="outline">
            <Link href="/enrollments">Back to Enrollments</Link>
          </Button>
        }
      />
      <EnrollmentCreateForm students={students} sections={sections} />
    </div>
  );
}
