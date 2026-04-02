import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SectionTable } from "@/components/sections/section-table";

export default async function SectionsPage() {
  await requireSchoolAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        description="Manage class sections and staff assignments."
        actions={
          <Button asChild>
            <Link href="/school/sections/create">Create Section</Link>
          </Button>
        }
      />
      <SectionTable />
    </div>
  );
}

