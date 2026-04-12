import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TimetableTable } from "@/components/timetable/timetable-table";
import { DragDropWeekTimetable } from "@/components/timetable/drag-drop-week";
import { requireSchoolAdminAccess } from "@/lib/rbac";
import { getTimetable } from "@/app/(school)/school/timetable/actions";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseTableFilterEnumParam, parseTextParam } from "@/lib/table-filters";
import { DayOfWeek } from "@/app/generated/prisma/enums";
import { TimetableFilters } from "@/components/timetable/timetable-filters";

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; dayOfWeek?: string }>;
}) {
  await requireSchoolAdminAccess();
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
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
  const slots = await getTimetable();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        description="Manage weekly schedules and prevent staff conflicts."
        actions={
          <Button asChild>
            <Link href="/school/timetable/create">Create Slot</Link>
          </Button>
        }
      />
      <DragDropWeekTimetable slots={slots} />
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <TimetableFilters q={q} dayOfWeek={dayOfWeek} />
        </CardContent>
      </Card>
      <TimetableTable
        page={page}
        filters={{ q, dayOfWeek }}
        searchParams={{
          q: params.q,
          dayOfWeek: params.dayOfWeek,
          page: params.page,
        }}
      />
    </div>
  );
}
