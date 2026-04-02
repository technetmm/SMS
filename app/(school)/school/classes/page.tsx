import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ClassTable } from "@/components/classes/class-table";

export default async function ClassesPage() {
  await requireSchoolAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        description="Manage classes for your school."
        actions={
          <Button asChild>
            <Link href="/school/classes/create">Create Class</Link>
          </Button>
        }
      />
      <ClassTable />
    </div>
  );
}
