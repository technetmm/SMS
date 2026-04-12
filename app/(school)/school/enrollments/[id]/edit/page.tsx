import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EnrollmentEditForm } from "@/components/enrollments/enrollment-edit-form";
import { getEnrollmentEditFormOptions } from "@/app/(school)/school/enrollments/actions";
import { requireSchoolAdmin } from "@/lib/permissions";

export default async function EditEnrollmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSchoolAdmin();
  const { id } = await params;

  const data = await getEnrollmentEditFormOptions(id);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Enrollment"
        description="Update enrollment details, section assignment, and billing inputs."
        actions={
          <Button asChild variant="outline">
            <Link href="/school/enrollments">Back to Enrollments</Link>
          </Button>
        }
      />

      <EnrollmentEditForm
        currency={data.currency}
        enrollment={data.enrollment}
        sections={data.sections}
      />
    </div>
  );
}
