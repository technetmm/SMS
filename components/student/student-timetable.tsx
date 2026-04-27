import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma/client";
import { getTranslations } from "next-intl/server";

interface StudentTimetableProps {
  studentId: string;
  schoolId: string;
}

const dayOrder = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export async function StudentTimetable({
  studentId,
  schoolId,
}: StudentTimetableProps) {
  const t = await getTranslations("StudentDashboard.timetable");

  const enrollments = await prisma.enrollment.findMany({
    where: {
      schoolId,
      studentId,
      status: "ACTIVE",
    },
    select: {
      sectionId: true,
    },
  });

  const sectionIds = enrollments.map((e) => e.sectionId);

  if (sectionIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        </CardContent>
      </Card>
    );
  }

  const timetables = await prisma.timetable.findMany({
    where: {
      schoolId,
      sectionId: {
        in: sectionIds,
      },
    },
    include: {
      section: {
        include: {
          class: true,
        },
      },
      staff: true,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const groupedTimetables = timetables.reduce(
    (acc, timetable) => {
      if (!acc[timetable.dayOfWeek]) {
        acc[timetable.dayOfWeek] = [];
      }
      acc[timetable.dayOfWeek].push(timetable);
      return acc;
    },
    {} as Record<string, typeof timetables>,
  );

  const sortedDays = Object.keys(groupedTimetables).sort(
    (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedDays.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDays.map((day) => (
              <div key={day} className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground uppercase">
                  {t(`days.${day.toLowerCase()}`)}
                </h4>
                <div className="rounded-lg border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("columns.time")}</TableHead>
                        <TableHead>{t("columns.section")}</TableHead>
                        <TableHead>{t("columns.class")}</TableHead>
                        <TableHead>{t("columns.teacher")}</TableHead>
                        <TableHead>{t("columns.room")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedTimetables[day].map((timetable) => (
                        <TableRow key={timetable.id}>
                          <TableCell className="font-medium">
                            {timetable.startTime} - {timetable.endTime}
                          </TableCell>
                          <TableCell>{timetable.section.name}</TableCell>
                          <TableCell>{timetable.section.class.name}</TableCell>
                          <TableCell>{timetable.staff.name}</TableCell>
                          <TableCell>
                            {timetable.room || (
                              <Badge variant="outline">{t("noRoom")}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
