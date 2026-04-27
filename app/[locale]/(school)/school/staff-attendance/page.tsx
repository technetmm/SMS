import { AttendanceStatus } from "@/app/generated/prisma/enums";
import {
  getAssignedStaffs,
  markStaffAttendance,
} from "@/app/(school)/school/staff-attendance/actions";
import { StaffAttendanceForm } from "@/components/staff-attendance/staff-attendance-form";
import { StaffAttendanceTable } from "@/components/staff-attendance/staff-attendance-table";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePageParam } from "@/lib/pagination";
import { requireSchoolAdminAccess } from "@/lib/rbac";
import {
  parseDateRangeParams,
  parseTableFilterEnumParam,
  parseTextParam,
} from "@/lib/table-filters";
import { StaffAttendanceFilter } from "@/components/staff-attendance/staff-attendance-filter";
import { getTranslations } from "next-intl/server";

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

  const [t, staff] = await Promise.all([
    getTranslations("SchoolEntities.staffAttendance.list"),
    getAssignedStaffs(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <StaffAttendanceForm action={markStaffAttendance} staff={staff} />

      <Card>
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
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
