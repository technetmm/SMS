import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EnrollmentEditForm } from "@/components/enrollments/enrollment-edit-form";
import { getEnrollmentEditFormOptions } from "@/app/(school)/school/enrollments/actions";
import { requireSchoolAdmin } from "@/lib/permissions";
import { getTranslations } from "next-intl/server";

export default async function EditEnrollmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.enrollments");
  const { id } = await params;

  const data = await getEnrollmentEditFormOptions(id);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("edit.title")}
        description={t("edit.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/enrollments">{t("edit.back")}</Link>
          </Button>
        }
      />

      <EnrollmentEditForm
        currency={data.currency}
        enrollment={data.enrollment}
        students={data.students}
        sections={data.sections}
      />
    </div>
  );
}
