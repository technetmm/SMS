import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CourseTable } from "@/components/courses/course-table";

export default async function CoursesPage() {
  await requireSchoolAdmin();

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
      <CourseTable />
    </div>
  );
}

