import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { UserRole } from "@/app/generated/prisma";
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

  await requireRole([UserRole.ADMIN]);

  const teacher = await prisma.teacher.findUnique({
    where: { id: id },
  });

  if (!teacher) {
    return null;
    // redirect("/teachers");
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
