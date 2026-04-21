import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SubjectForm } from "@/components/subjects/subject-form";
import { getSubjectById, updateSubject } from "@/app/(school)/school/subjects/actions";
import { getTranslations } from "next-intl/server";

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.subjects");
  const { id } = await params;

  const subject = await getSubjectById(id);
  if (!subject) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("edit.title")}
        description={t("edit.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/subjects">{t("edit.back")}</Link>
          </Button>
        }
      />
      <SubjectForm mode="edit" action={updateSubject} initialData={subject} />
    </div>
  );
}
