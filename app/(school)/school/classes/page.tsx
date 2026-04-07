import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ClassTable } from "@/components/classes/class-table";
import { parsePageParam } from "@/lib/pagination";

export default async function ClassesPage({
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
        title="Classes"
        description="Manage classes for your school."
        actions={
          <Button asChild>
            <Link href="/school/classes/create">Create Class</Link>
          </Button>
        }
      />
      <ClassTable page={page} />
    </div>
  );
}
