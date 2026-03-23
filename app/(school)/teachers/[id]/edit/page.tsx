import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/permissions";
import { requireTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TeacherEditForm } from "@/components/teachers/teacher-edit-form";

function toDateInput(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) {
    redirect("/teachers");
  }

  await requireSchoolAdmin();
  const tenantId = await requireTenantId();

  const teacher = await prisma.teacher.findFirst({
    where: { id, tenantId },
  });

  if (!teacher) {
    redirect("/teachers");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Teacher"
        description="Update teacher details and employment info."
        actions={
          <Button asChild variant="outline">
            <Link href={`/teachers/${teacher.id}`}>Back to Details</Link>
          </Button>
        }
      />
      <TeacherEditForm
        teacher={{
          id: teacher.id,
          name: teacher.name,
          jobTitle: teacher.jobTitle,
          nrcNumber: teacher.nrcNumber,
          dob: toDateInput(teacher.dob),
          email: teacher.email,
          gender: teacher.gender,
          maritalStatus: teacher.maritalStatus,
          parmentAddress: teacher.parmentAddress,
          currentAddress: teacher.currentAddress,
          phone: teacher.phone,
          hireDate: toDateInput(teacher.hireDate),
          exitDate: toDateInput(teacher.exitDate ?? null),
          status: teacher.status,
          ratePerSection: teacher.ratePerSection.toString(),
          remark: teacher.remark,
        }}
      />
    </div>
  );
}
