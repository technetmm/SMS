import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CourseForm } from "@/components/courses/course-form";
import { getCourseById, updateCourse } from "@/app/(school)/courses/actions";
import { getSubjects } from "@/app/(school)/subjects/actions";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSchoolAdmin();
  const { id } = await params;

  const [course, subjects] = await Promise.all([
    getCourseById(id),
    getSubjects(),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Course"
        description="Update course details and subject assignment."
        actions={
          <Button asChild variant="outline">
            <Link href="/courses">Back</Link>
          </Button>
        }
      />
      <CourseForm
        mode="edit"
        action={updateCourse}
        initialData={{
          id: course.id,
          name: course.name,
          subjects: course.subjects,
        }}
        subjects={subjects.map((subject) => ({
          id: subject.id,
          name: subject.name,
        }))}
      />
    </div>
  );
}
