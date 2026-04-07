import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SubjectTable } from "@/components/subjects/subject-table";
import { parsePageParam } from "@/lib/pagination";

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireSchoolAdmin();
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Manage curriculum subjects for your school."
        actions={
          <Button asChild>
            <Link href="/school/subjects/create">Create Subject</Link>
          </Button>
        }
      />
      <SubjectTable page={page} />
    </div>
  );
}

