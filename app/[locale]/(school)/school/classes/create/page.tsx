import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdmin } from "@/lib/permissions";
import { requireTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ClassForm } from "@/components/classes/class-form";
import { createClass } from "@/app/(school)/school/classes/actions";
import { getTranslations } from "next-intl/server";

export default async function CreateClassPage() {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.classes");
  const schoolId = await requireTenantId();

  const courses = await prisma.course.findMany({
    where: { schoolId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("create.title")}
        description={t("create.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/classes">{t("create.back")}</Link>
          </Button>
        }
      />
      <ClassForm mode="create" action={createClass} courses={courses} />
    </div>
  );
}
