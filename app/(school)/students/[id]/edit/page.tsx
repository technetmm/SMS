import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/permissions";
import { getStudentById } from "@/app/(school)/students/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StudentForm } from "@/components/students/student-form";

function toDateInput(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSchoolAdmin();

  const { id } = await params;

  if (!id) {
    redirect("/students");
  }

  const student = await getStudentById(id);
  if (!student) {
    redirect("/students");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Student"
        description="Update student profile information."
        actions={
          <Button asChild variant="outline">
            <Link href="/students">Back to Students</Link>
          </Button>
        }
      />
      <StudentForm
        mode="edit"
        initialData={{
          id: student.id,
          name: student.name,
          gender: student.gender,
          dob: toDateInput(student.dob),
          fatherName: student.fatherName,
          motherName: student.motherName,
          phone: student.phone,
          address: student.address,
          status: student.status,
        }}
      />
    </div>
  );
}
