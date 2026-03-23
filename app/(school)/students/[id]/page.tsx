import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/permissions";
import { getStudentById } from "@/app/(school)/students/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { enumLabel, GENDER_LABELS, STUDENT_STATUS_LABELS } from "@/lib/enum-labels";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(value);
}

export default async function StudentDetailPage({
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
        title={student.name}
        description="Student profile information."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/students">Back</Link>
            </Button>
            <Button asChild>
              <Link href={`/students/${student.id}/edit`}>Edit</Link>
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender</span>
              <span>{enumLabel(student.gender, GENDER_LABELS)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of birth</span>
              <span>{formatDate(student.dob)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={student.status === "ACTIVE" ? "default" : "outline"}>
                {enumLabel(student.status, STUDENT_STATUS_LABELS)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Father</span>
              <span>{student.fatherName ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mother</span>
              <span>{student.motherName ?? "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{student.phone ?? "-"}</span>
            </div>
            <div>
              <p className="text-muted-foreground">Address</p>
              <p>{student.address ?? "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
