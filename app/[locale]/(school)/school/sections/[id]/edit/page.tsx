import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdmin } from "@/lib/permissions";
import { requireTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SectionForm } from "@/components/sections/section-form";
import { getSectionById, updateSection } from "@/app/(school)/school/sections/actions";
import { getTranslations } from "next-intl/server";

export default async function EditSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.sections");
  const schoolId = await requireTenantId();
  const { id } = await params;

  const [section, classes, staff] = await Promise.all([
    getSectionById(id),
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

  if (!section) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("edit.title")}
        description={t("edit.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/sections">{t("edit.back")}</Link>
          </Button>
        }
      />
      <SectionForm
        mode="edit"
        action={updateSection}
        classes={classes}
        staff={staff}
        initialData={{
          id: section.id,
          name: section.name,
          classId: section.classId,
          staffIds: section.staffMappings.map((item) => item.staff.id),
          room: section.room,
          meetingLink: section.meetingLink,
          capacity: section.capacity,
        }}
      />
    </div>
  );
}
