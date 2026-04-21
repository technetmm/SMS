import { DayOfWeek } from "@/app/generated/prisma/enums";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherTimetableFilters } from "@/components/teacher/teacher-timetable-filters";
import { TeacherTimetableTable } from "@/components/teacher/teacher-timetable-table";
import { TeacherAccessFallback } from "@/components/teacher/teacher-access-fallback";
import {
  getTeacherTimetable,
  requireTeacherAccess,
} from "@/app/(teacher)/teacher/actions";
import { parsePageParam } from "@/lib/pagination";
import { parseTableFilterEnumParam, parseTextParam } from "@/lib/table-filters";
import { getTranslations } from "next-intl/server";

export default async function TeacherTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; dayOfWeek?: string }>;
}) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const q = parseTextParam(params.q);
  const dayOfWeek = parseTableFilterEnumParam(params.dayOfWeek, [
    DayOfWeek.MON,
    DayOfWeek.TUE,
    DayOfWeek.WED,
    DayOfWeek.THU,
    DayOfWeek.FRI,
    DayOfWeek.SAT,
    DayOfWeek.SUN,
  ] as const);

  const [t, scope, rows] = await Promise.all([
    getTranslations("TeacherSite.timetable"),
    requireTeacherAccess(),
    getTeacherTimetable({ page, filters: { q, dayOfWeek } }),
  ]);

  if (!scope.schoolId || !scope.staffId) {
    return <TeacherAccessFallback />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherTimetableFilters q={q} dayOfWeek={dayOfWeek} />
        </CardContent>
      </Card>
      <TeacherTimetableTable
        rows={rows}
        searchParams={{ q: params.q, dayOfWeek: params.dayOfWeek, page: params.page }}
      />
    </div>
  );
}
