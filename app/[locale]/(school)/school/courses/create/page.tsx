import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CourseForm } from "@/components/courses/course-form";
import { createCourse } from "@/app/(school)/school/courses/actions";
import { getSubjects } from "@/app/(school)/school/subjects/actions";
import { getTranslations } from "next-intl/server";

export default async function CreateCoursePage() {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.courses");
  const subjects = await getSubjects();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("create.title")}
        description={t("create.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/courses">{t("create.back")}</Link>
          </Button>
        }
      />
      <CourseForm
        mode="create"
        action={createCourse}
        subjects={subjects.map((subject) => ({
          id: subject.id,
          name: subject.name,
        }))}
      />
    </div>
  );
}
