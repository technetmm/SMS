import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdmin } from "@/lib/permissions";
import { requireTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ClassForm } from "@/components/classes/class-form";
import { getClassById, updateClass } from "@/app/(school)/school/classes/actions";
import { getTranslations } from "next-intl/server";

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.classes");
  const schoolId = await requireTenantId();
  const { id } = await params;

  const [klass, courses] = await Promise.all([
    getClassById(id),
    prisma.course.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!klass) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("edit.title")}
        description={t("edit.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/classes">{t("edit.back")}</Link>
          </Button>
        }
      />
      <ClassForm
        mode="edit"
        action={updateClass}
        courses={courses}
        initialData={{
          id: klass.id,
          name: klass.name,
          classType: klass.classType,
          programType: klass.programType,
          billingType: klass.billingType,
          courseId: klass.courseId,
          fee: Number(klass.fee),
        }}
      />
    </div>
  );
}
