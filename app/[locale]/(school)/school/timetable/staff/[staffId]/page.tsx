import Link from "next/link";
import { redirect } from "next/navigation";
import { DayOfWeek } from "@/app/generated/prisma/enums";
import { getTimetable } from "@/app/(school)/school/timetable/actions";
import { TimetableFilters } from "@/components/timetable/timetable-filters";
import { TimetableTable } from "@/components/timetable/timetable-table";
import { DragDropWeekTimetable } from "@/components/timetable/drag-drop-week";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePageParam } from "@/lib/pagination";
import { prisma } from "@/lib/prisma/client";
import { requireSchoolAdminAccess, requireTenant } from "@/lib/rbac";
import { parseTableFilterEnumParam, parseTextParam } from "@/lib/table-filters";
import { getTranslations } from "next-intl/server";

export default async function StaffWeeklyTimetablePage({
  params,
  searchParams,
}: {
  params: Promise<{ staffId: string }>;
  searchParams: Promise<{ page?: string; q?: string; dayOfWeek?: string }>;
}) {
  await requireSchoolAdminAccess();
  const schoolId = await requireTenant();
  const { staffId } = await params;
  const query = await searchParams;

  if (!staffId) {
    redirect("/school/timetable");
  }

  const page = parsePageParam(query.page);
  const q = parseTextParam(query.q);
  const dayOfWeek = parseTableFilterEnumParam(query.dayOfWeek, [
    DayOfWeek.MON,
    DayOfWeek.TUE,
    DayOfWeek.WED,
    DayOfWeek.THU,
    DayOfWeek.FRI,
    DayOfWeek.SAT,
    DayOfWeek.SUN,
  ] as const);

  const [t, staff, slots] = await Promise.all([
    getTranslations("SchoolEntities.timetable.list"),
    prisma.staff.findFirst({
      where: { id: staffId, schoolId },
      select: { id: true, name: true },
    }),
    getTimetable({ staffId }),
  ]);

  if (!staff) {
    redirect("/school/timetable");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("staffWeekly.title", { staff: staff.name })}
        description={t("staffWeekly.description", { staff: staff.name })}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/timetable">{t("staffWeekly.back")}</Link>
          </Button>
        }
      />
      <DragDropWeekTimetable slots={slots} />
      <Card>
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TimetableFilters
            q={q}
            dayOfWeek={dayOfWeek}
            resetPath={`/school/timetable/staff/${staff.id}`}
          />
        </CardContent>
      </Card>
      <TimetableTable
        page={page}
        filters={{ q, dayOfWeek, staffId: staff.id }}
        pathname={`/school/timetable/staff/${staff.id}`}
        searchParams={{
          q: query.q,
          dayOfWeek: query.dayOfWeek,
          page: query.page,
        }}
      />
    </div>
  );
}
