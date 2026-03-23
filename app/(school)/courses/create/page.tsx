import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CourseForm } from "@/components/courses/course-form";
import { createCourse } from "@/app/(school)/courses/actions";
import { getSubjects } from "@/app/(school)/subjects/actions";

export default async function CreateCoursePage() {
  await requireSchoolAdmin();
  const subjects = await getSubjects();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Course"
        description="Add a course and assign a subject."
        actions={
          <Button asChild variant="outline">
            <Link href="/courses">Back</Link>
          </Button>
        }
      />
      <CourseForm
        mode="create"
        action={createCourse}
        subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
      />
    </div>
  );
}

