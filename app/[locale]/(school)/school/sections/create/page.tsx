import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdmin } from "@/lib/permissions";
import { requireTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SectionForm } from "@/components/sections/section-form";
import { createSection } from "@/app/(school)/school/sections/actions";
import { getTranslations } from "next-intl/server";

export default async function CreateSectionPage() {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.sections");
  const schoolId = await requireTenantId();

  const [classes, staff] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.staff.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("create.title")}
        description={t("create.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/sections">{t("create.back")}</Link>
          </Button>
        }
      />
      <SectionForm
        mode="create"
        action={createSection}
        classes={classes}
        staff={staff}
      />
    </div>
  );
}
