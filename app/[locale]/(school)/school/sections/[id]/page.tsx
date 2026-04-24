import Link from "next/link";
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
import { getSectionDetailById } from "@/app/(school)/school/sections/actions";
import { getTranslations } from "next-intl/server";

export default async function SectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [section, t, timetableT, commonT] = await Promise.all([
    getSectionDetailById(id),
    getTranslations("TeacherSite.sectionDetails"),
    getTranslations("SchoolEntities.timetable.table"),
    getTranslations("Common"),
  ]);

  if (!section) {
    redirect("/school/sections");
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
        description="Section details, timetable, and enrolled students."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/school/sections">{commonT("back")}</Link>
            </Button>
            <Button asChild>
              <Link href={`/school/sections/${section.id}/edit`}>
                {commonT("edit")}
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("summary.class")}</CardTitle>
          </CardHeader>
          <CardContent>{section.class.name}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("summary.students")}</CardTitle>
          </CardHeader>
          <CardContent>
            {section.activeStudents} / {section.capacity}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("summary.room")}</CardTitle>
          </CardHeader>
          <CardContent>{section.room ?? "-"}</CardContent>
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
                  {commonT("joinMeeting")}
                </a>
              </Button>
            ) : (
              "-"
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("summary.assignedTeacher")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {section.staffMappings.length > 0 ? (
            section.staffMappings.map((row) => (
              <Badge key={row.staff.id} variant="outline">
                {row.staff.name}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No staff assigned.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("timetable.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{timetableT("columns.day")}</TableHead>
                <TableHead>{timetableT("columns.time")}</TableHead>
                <TableHead>{timetableT("columns.teacher")}</TableHead>
                <TableHead>{timetableT("columns.room")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {section.timetables.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell>{dayLabel(slot.dayOfWeek)}</TableCell>
                  <TableCell className="font-medium">
                    {slot.startTime} - {slot.endTime}
                  </TableCell>
                  <TableCell>{slot.staff.name}</TableCell>
                  <TableCell>{slot.room ?? "-"}</TableCell>
                </TableRow>
              ))}
              {section.timetables.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No timetable slots for this section.
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
              {section.enrollments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.student.name}
                  </TableCell>
                  <TableCell>{row.student.phone ?? "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={row.status === "ACTIVE" ? "default" : "outline"}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {section.enrollments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No students enrolled in this section.
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
