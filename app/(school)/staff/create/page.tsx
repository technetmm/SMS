import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StaffForm } from "@/components/staff/staff-form";

export default async function CreateStaffPage() {
  await requireSchoolAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Staff"
        description="Create a new staff account and link it to a user."
        actions={
          <Button asChild variant="outline">
            <Link href="/staff">Back to Staff</Link>
          </Button>
        }
      />
      <StaffForm />
    </div>
  );
}
