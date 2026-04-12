import { AttendanceStatus } from "@/app/generated/prisma/enums";
import { markStaffAttendance } from "@/app/(school)/school/staff-attendance/actions";
import { StaffAttendanceForm } from "@/components/staff-attendance/staff-attendance-form";
import { StaffAttendanceTable } from "@/components/staff-attendance/staff-attendance-table";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePageParam } from "@/lib/pagination";
import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import {
  parseDateRangeParams,
  parseTableFilterEnumParam,
  parseTextParam,
} from "@/lib/table-filters";
import { StaffAttendanceFilter } from "@/components/staff-attendance/staff-attendance-filter";

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
  const status = parseTableFilterEnumParam(params.status, [
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
          <StaffAttendanceFilter
            q={q}
            status={status}
            dateFrom={params.dateFrom}
            dateTo={params.dateTo}
          />
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
