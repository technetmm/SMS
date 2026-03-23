import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdmin } from "@/lib/permissions";
import { requireTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ClassForm } from "@/components/classes/class-form";
import { createClass } from "@/app/(school)/classes/actions";

export default async function CreateClassPage() {
  await requireSchoolAdmin();
  const tenantId = await requireTenantId();

  const courses = await prisma.course.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Class"
        description="Add a new class."
        actions={
          <Button asChild variant="outline">
            <Link href="/classes">Cancel</Link>
          </Button>
        }
      />
      <ClassForm mode="create" action={createClass} courses={courses} />
    </div>
  );
}

