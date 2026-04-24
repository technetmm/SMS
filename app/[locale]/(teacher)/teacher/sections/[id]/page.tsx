import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getTeacherSectionDetail,
  requireTeacherAccess,
} from "@/app/(teacher)/teacher/actions";
import { formatTimetableTimeRange } from "@/lib/formatter";
import { getLocale, getTranslations } from "next-intl/server";

export default async function TeacherSectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [scope, t, timetableT, section, locale] = await Promise.all([
    requireTeacherAccess(),
    getTranslations("TeacherSite.sectionDetails"),
    getTranslations("SchoolEntities.timetable.table"),
    getTeacherSectionDetail(id),
    getLocale(),
  ]);

  if (!scope.schoolId || !scope.staffId) {
    redirect("/teacher/sections");
  }

  if (!section) {
    redirect("/teacher/sections");
  }

  const dayLabel = (day: string) => {
    const key = day.toLowerCase() as
      | "mon"
      | "tue"
      | "wed"
      | "thu"
      | "fri"
      | "sat"
      | "sun";
    return timetableT(`days.${key}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={section.name}
        description={t("description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/teacher/sections">{t("back")}</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("summary.class")}</CardTitle>
          </CardHeader>
          <CardContent>{section.className}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("summary.students")}</CardTitle>
          </CardHeader>
          <CardContent>
            {t("summary.studentsValue", {
              count: section.activeStudents,
              capacity: section.capacity,
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("summary.room")}</CardTitle>
          </CardHeader>
          <CardContent>
            {section.room ? section.room : t("notAvailable")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("summary.meeting")}</CardTitle>
          </CardHeader>
          <CardContent>
            {section.meetingLink ? (
              <Button asChild size="sm">
                <a
                  href={section.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("joinMeeting")}
                </a>
              </Button>
            ) : (
              t("notAvailable")
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("timetable.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("timetable.columns.day")}</TableHead>
                <TableHead>{t("timetable.columns.time")}</TableHead>
                <TableHead>{t("timetable.columns.teacher")}</TableHead>
                <TableHead>{t("timetable.columns.room")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {section.timetable.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell>{dayLabel(slot.dayOfWeek)}</TableCell>
                  <TableCell className="font-medium">
                    {formatTimetableTimeRange(slot.startTime, slot.endTime, locale)}
                  </TableCell>
                  <TableCell>{slot.staff.name}</TableCell>
                  <TableCell>{slot.room ?? t("notAvailable")}</TableCell>
                </TableRow>
              ))}
              {section.timetable.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {t("timetable.empty")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("students.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("students.columns.name")}</TableHead>
                <TableHead>{t("students.columns.phone")}</TableHead>
                <TableHead>{t("students.columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {section.students.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.student.name}</TableCell>
                  <TableCell>{row.student.phone ?? t("notAvailable")}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "ACTIVE" ? "default" : "outline"}>
                      {t(`students.status.${row.status.toLowerCase() as "active" | "completed" | "dropped"}`)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {section.students.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {t("students.empty")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
