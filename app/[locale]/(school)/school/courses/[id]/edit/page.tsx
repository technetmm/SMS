import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CourseForm } from "@/components/courses/course-form";
import { getCourseById, updateCourse } from "@/app/(school)/school/courses/actions";
import { getSubjects } from "@/app/(school)/school/subjects/actions";
import { getTranslations } from "next-intl/server";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.courses");
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
        title={t("edit.title")}
        description={t("edit.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/courses">{t("edit.back")}</Link>
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
