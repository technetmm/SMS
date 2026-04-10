import Link from "next/link";
import { requireSchoolAdminAccess } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { EnrollmentAttendanceForm } from "@/components/enrollments/enrollment-attendance-form";
import { EnrollmentAttendanceTable } from "@/components/enrollments/enrollment-attendance-table";
import {
  getPaginatedAttendanceRecords,
  getEnrollments,
} from "@/app/(school)/school/enrollments/actions";
import { requireTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parsePageParam } from "@/lib/pagination";
import { AttendanceStatus } from "@/app/generated/prisma/enums";
import { parseDateRangeParams, parseEnumParam, parseTextParam } from "@/lib/table-filters";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    sectionId?: string;
    studentId?: string;
    date?: string;
    q?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenantId();
  const params = await searchParams;
  const q = parseTextParam(params.q);
  const status = parseEnumParam(params.status, [
    AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT,
    AttendanceStatus.LATE,
    AttendanceStatus.LEAVE,
  ] as const);
  const { from: dateFrom, to: dateTo } = parseDateRangeParams({
    from: params.dateFrom,
    to: params.dateTo,
  });

  const page = parsePageParam(params.page);
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
    getPaginatedAttendanceRecords({
      page,
      filters: {
        studentId: params.studentId || undefined,
        sectionId: params.sectionId || undefined,
        date: params.date ? new Date(`${params.date}T00:00:00Z`) : undefined,
        q,
        status,
        dateFrom,
        dateTo,
      },
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
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={params.date ?? ""}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="q">Search</Label>
              <Input id="q" name="q" defaultValue={q} placeholder="Student, section, class" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={status ?? ""}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All statuses</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="LEAVE">Leave</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input id="dateFrom" name="dateFrom" type="date" defaultValue={parseTextParam(params.dateFrom)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input id="dateTo" name="dateTo" type="date" defaultValue={parseTextParam(params.dateTo)} />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" variant="default">
                Apply
              </Button>
              <Button asChild variant="outline">
                <Link href="/school/attendance">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <EnrollmentAttendanceTable
        rows={rows}
        pathname="/school/attendance"
        searchParams={{
          studentId: params.studentId,
          sectionId: params.sectionId,
          date: params.date,
          q: params.q,
          status: params.status,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          page: params.page,
        }}
      />
    </div>
  );
}
