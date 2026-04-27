import { AttendanceStatus } from "@/app/generated/prisma/enums";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollmentAttendanceTable } from "@/components/enrollments/enrollment-attendance-table";
import { TeacherAttendanceForm } from "@/components/teacher/teacher-attendance-form";
import { TeacherAttendanceFilters } from "@/components/teacher/teacher-attendance-filters";
import { TeacherAccessFallback } from "@/components/teacher/teacher-access-fallback";
import {
  getTeacherAttendanceFormOptions,
  getTeacherPaginatedAttendanceRecords,
  requireTeacherAccess,
} from "@/app/(teacher)/teacher/actions";
import { parsePageParam } from "@/lib/pagination";
import {
  parseDateRangeParams,
  parseTableFilterEnumParam,
  parseTextParam,
} from "@/lib/table-filters";
import { getTranslations } from "next-intl/server";
import { getAppIsoDate } from "@/lib/app-time";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    studentId?: string;
    sectionId?: string;
    date?: string;
    q?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}) {
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

  const [t, scope, formOptions, rows] = await Promise.all([
    getTranslations("TeacherSite.attendance"),
    requireTeacherAccess(),
    getTeacherAttendanceFormOptions(),
    getTeacherPaginatedAttendanceRecords({
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

  if (!scope.schoolId || !scope.staffId) {
    return <TeacherAccessFallback />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <TeacherAttendanceForm
        defaultDate={today}
        students={formOptions.students}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherAttendanceFilters
            q={q}
            studentId={params.studentId}
            sectionId={params.sectionId}
            status={status}
            date={params.date}
            dateFrom={params.dateFrom}
            dateTo={params.dateTo}
            students={formOptions.students}
            sections={formOptions.sections}
          />
        </CardContent>
      </Card>

      <EnrollmentAttendanceTable
        rows={rows}
        pathname="/teacher/attendance"
        canDelete={false}
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
