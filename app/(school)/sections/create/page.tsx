import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdmin } from "@/lib/permissions";
import { requireTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SectionForm } from "@/components/sections/section-form";
import { createSection } from "@/app/(school)/sections/actions";

export default async function CreateSectionPage() {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();

  const [classes, teachers] = await Promise.all([
    prisma.class.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.teacher.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Section"
        description="Add a section and optionally assign a teacher."
        actions={
          <Button asChild variant="outline">
            <Link href="/sections">Cancel</Link>
          </Button>
        }
      />
      <SectionForm
        mode="create"
        action={createSection}
        classes={classes}
        teachers={teachers}
      />
    </div>
  );
}
