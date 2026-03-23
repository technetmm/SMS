import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SubjectForm } from "@/components/subjects/subject-form";
import { createSubject } from "@/app/(school)/subjects/actions";

export default async function CreateSubjectPage() {
  await requireSchoolAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Subject"
        description="Add a new subject to your school catalog."
        actions={
          <Button asChild variant="outline">
            <Link href="/subjects">Back to Subjects</Link>
          </Button>
        }
      />
      <SubjectForm mode="create" action={createSubject} />
    </div>
  );
}
