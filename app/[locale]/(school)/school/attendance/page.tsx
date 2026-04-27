import { requireSchoolAdminAccess } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { EnrollmentAttendanceForm } from "@/components/enrollments/enrollment-attendance-form";
import { EnrollmentAttendanceTable } from "@/components/enrollments/enrollment-attendance-table";
import {
  getEnrolledSections,
  getEnrolledStudents,
  getPaginatedAttendanceRecords,
} from "@/app/(school)/school/enrollments/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePageParam } from "@/lib/pagination";
import { AttendanceStatus } from "@/app/generated/prisma/enums";
import {
  parseDateRangeParams,
  parseTableFilterEnumParam,
  parseTextParam,
} from "@/lib/table-filters";
import { AttendanceFilters } from "@/components/attendance/attendance-filters";
import { getTranslations } from "next-intl/server";
import { getAppIsoDate } from "@/lib/app-time";

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
  const params = await searchParams;
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

  const page = parsePageParam(params.page);
  const t = await getTranslations("SchoolEntities.attendance.list");
  const [students, sections, rows] = await Promise.all([
    getEnrolledStudents(),
    getEnrolledSections(),
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
  const today = getAppIsoDate();

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <EnrollmentAttendanceForm defaultDate={today} students={students} />

      <Card>
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceFilters
            q={q}
            studentId={params.studentId}
            sectionId={params.sectionId}
            status={status}
            date={params.date}
            dateFrom={params.dateFrom}
            dateTo={params.dateTo}
            students={students}
            sections={sections}
          />
        </CardContent>
      </Card>

      <EnrollmentAttendanceTable
        rows={rows}
        pathname="/school/attendance"
        canDelete={true}
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
