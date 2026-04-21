import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/permissions";
import { getStudentById } from "@/app/(school)/school/students/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StudentForm } from "@/components/students/student-form";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("SchoolEntities.students");

  const { id } = await params;

  if (!id) {
    redirect("/school/students");
  }

  const student = await getStudentById(id);
  if (!student) {
    redirect("/school/students");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("edit.title")}
        description={t("edit.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/students">{t("edit.back")}</Link>
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
          admissionDate: toDateInput(student.admissionDate),
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
