import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StudentForm } from "@/components/students/student-form";
import { getTranslations } from "next-intl/server";

export default async function CreateStudentPage() {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.students");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("create.title")}
        description={t("create.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/students">{t("create.back")}</Link>
          </Button>
        }
      />
      <StudentForm mode="create" />
    </div>
  );
}
