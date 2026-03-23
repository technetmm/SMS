import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SubjectTable } from "@/components/subjects/subject-table";

export default async function SubjectsPage() {
  await requireSchoolAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Manage curriculum subjects for your school."
        actions={
          <Button asChild>
            <Link href="/subjects/create">Create Subject</Link>
          </Button>
        }
      />
      <SubjectTable />
    </div>
  );
}

