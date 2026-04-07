import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CourseTable } from "@/components/courses/course-table";
import { parsePageParam } from "@/lib/pagination";

export default async function CoursesPage({
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
        title="Courses"
        description="Manage courses and map them to subjects."
        actions={
          <Button asChild>
            <Link href="/school/courses/create">Create Course</Link>
          </Button>
        }
      />
      <CourseTable page={page} />
    </div>
  );
}

