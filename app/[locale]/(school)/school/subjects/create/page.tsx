import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SubjectForm } from "@/components/subjects/subject-form";
import { createSubject } from "@/app/(school)/school/subjects/actions";
import { getTranslations } from "next-intl/server";

export default async function CreateSubjectPage() {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.subjects");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("create.title")}
        description={t("create.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/subjects">{t("create.back")}</Link>
          </Button>
        }
      />
      <SubjectForm mode="create" action={createSubject} />
    </div>
  );
}
