import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EnrollmentCreateForm } from "@/components/enrollments/enrollment-create-form";
import { getEnrollmentFormOptions } from "@/app/(school)/school/enrollments/actions";
import { requireSchoolAdmin } from "@/lib/permissions";
import { getTranslations } from "next-intl/server";

export default async function CreateEnrollmentPage() {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.enrollments");

  const { students, sections, currency } = await getEnrollmentFormOptions();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("create.title")}
        description={t("create.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/enrollments">{t("create.back")}</Link>
          </Button>
        }
      />
      <EnrollmentCreateForm
        students={students}
        sections={sections}
        currency={currency}
      />
    </div>
  );
}
