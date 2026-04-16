import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SubjectForm } from "@/components/subjects/subject-form";
import { getSubjectById, updateSubject } from "@/app/(school)/school/subjects/actions";

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSchoolAdmin();
  const { id } = await params;

  const subject = await getSubjectById(id);
  if (!subject) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Subject"
        description="Update subject details."
        actions={
          <Button asChild variant="outline">
            <Link href="/school/subjects">Back</Link>
          </Button>
        }
      />
      <SubjectForm mode="edit" action={updateSubject} initialData={subject} />
    </div>
  );
}

