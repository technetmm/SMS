import Link from "next/link";
import { requireSchoolAdminAccess } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { EnrollmentAttendanceForm } from "@/components/enrollments/enrollment-attendance-form";
import { EnrollmentAttendanceTable } from "@/components/enrollments/enrollment-attendance-table";
import {
  getAttendanceRecords,
  getEnrollments,
} from "@/app/(school)/enrollments/actions";
import { requireTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; studentId?: string; date?: string }>;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenantId();
  const params = await searchParams;

  const [enrollments, students, sections, rows] = await Promise.all([
    getEnrollments(),
    prisma.student.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.section.findMany({
      where: { schoolId },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
      select: { id: true, name: true, class: { select: { name: true } } },
    }),
    getAttendanceRecords({
      studentId: params.studentId || undefined,
      sectionId: params.sectionId || undefined,
      date: params.date ? new Date(`${params.date}T00:00:00Z`) : undefined,
    }),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark and review attendance per enrollment (student + section)."
      />
      <EnrollmentAttendanceForm
        defaultDate={today}
        enrollments={enrollments.map((row) => ({
          id: row.id,
          label: `${row.student.name} • ${row.section.class.name} • ${row.section.name}`,
        }))}
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student</Label>
              <select
                id="studentId"
                name="studentId"
                defaultValue={params.studentId ?? ""}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sectionId">Section</Label>
              <select
                id="sectionId"
                name="sectionId"
                defaultValue={params.sectionId ?? ""}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All sections</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.class.name} • {section.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={params.date ?? ""} />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" variant="outline">Apply</Button>
              <Button asChild variant="ghost">
                <Link href="/attendance">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <EnrollmentAttendanceTable rows={rows} />
    </div>
  );
}
