import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/permissions";
import { requireTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StaffEditForm } from "@/components/staff/staff-edit-form";

function toDateInput(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) {
    redirect("/school/staff");
  }

  await requireSchoolAdmin();
  const schoolId = await requireTenantId();

  const staff = await prisma.staff.findFirst({
    where: { id, schoolId },
  });

  if (!staff) {
    redirect("/school/staff");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Staff"
        description="Update staff details and employment info."
        actions={
          <Button asChild variant="outline">
            <Link href={`/school/staff/${staff.id}`}>Back to Details</Link>
          </Button>
        }
      />
      <StaffEditForm
        staff={{
          id: staff.id,
          name: staff.name,
          jobTitle: staff.jobTitle,
          nrcNumber: staff.nrcNumber,
          dob: toDateInput(staff.dob),
          email: staff.email,
          gender: staff.gender,
          maritalStatus: staff.maritalStatus,
          parmentAddress: staff.parmentAddress,
          currentAddress: staff.currentAddress,
          phone: staff.phone,
          hireDate: toDateInput(staff.hireDate),
          exitDate: toDateInput(staff.exitDate ?? null),
          status: staff.status,
          ratePerSection: staff.ratePerSection.toString(),
          remark: staff.remark,
        }}
      />
    </div>
  );
}
