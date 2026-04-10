import Link from "next/link";
import { AttendanceStatus } from "@/app/generated/prisma/enums";
import { markStaffAttendance } from "@/app/(school)/school/staff-attendance/actions";
import { StaffAttendanceForm } from "@/components/staff-attendance/staff-attendance-form";
import { StaffAttendanceTable } from "@/components/staff-attendance/staff-attendance-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parsePageParam } from "@/lib/pagination";
import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import {
  parseDateRangeParams,
  parseEnumParam,
  parseTextParam,
} from "@/lib/table-filters";

export default async function StaffAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();
  const params = await searchParams;
  const page = parsePageParam(params.page);
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

  const [staff, sections] = await Promise.all([
    prisma.staff.findMany({
      where: { schoolId, isDeleted: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.section.findMany({
      where: { schoolId, isDeleted: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, class: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Attendance"
        description="Track staff attendance per section, per day."
      />
      <StaffAttendanceForm
        action={markStaffAttendance}
        staff={staff}
        sections={sections.map((section) => ({
          id: section.id,
          name: `${section.class.name} • ${section.name}`,
        }))}
      />

      <Card>
        <CardHeader>
          <CardTitle>Table Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input id="q" name="q" defaultValue={q} placeholder="Staff, section, class" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={status ?? ""}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="LEAVE">Leave</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                name="dateFrom"
                type="date"
                defaultValue={parseTextParam(params.dateFrom)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                name="dateTo"
                type="date"
                defaultValue={parseTextParam(params.dateTo)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/school/staff-attendance">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <StaffAttendanceTable
        page={page}
        filters={{ q, status, dateFrom, dateTo }}
        searchParams={{
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

