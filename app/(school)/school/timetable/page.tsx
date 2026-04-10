import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TimetableTable } from "@/components/timetable/timetable-table";
import { DragDropWeekTimetable } from "@/components/timetable/drag-drop-week";
import { requireSchoolAdminAccess } from "@/lib/rbac";
import { getTimetable } from "@/app/(school)/school/timetable/actions";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseEnumParam, parseTextParam } from "@/lib/table-filters";
import { DayOfWeek } from "@/app/generated/prisma/enums";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const dayOfWeek = parseEnumParam(params.dayOfWeek, [
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
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Staff, section, class, room"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dayOfWeek">Day</Label>
              <Select name="dayOfWeek" value={dayOfWeek}>
                <SelectTrigger id="dayOfWeek" className="w-full">
                  <SelectValue placeholder="Select day of week" />
                </SelectTrigger>
                <SelectContent position={"popper"}>
                  <SelectGroup>
                    <SelectItem value="MON">Monday</SelectItem>
                    <SelectItem value="TUE">Tuesday</SelectItem>
                    <SelectItem value="WED">Wednesday</SelectItem>
                    <SelectItem value="THU">Thursday</SelectItem>
                    <SelectItem value="FRI">Friday</SelectItem>
                    <SelectItem value="SAT">Saturday</SelectItem>
                    <SelectItem value="SUN">Sunday</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/school/timetable">Reset</Link>
              </Button>
            </div>
          </form>
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
