import { notFound } from "next/navigation";
import { UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/permissions";
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
import { getTranslations, getLocale } from "next-intl/server";
import { dateFormatter } from "@/lib/formatter";
import Link from "next/link";

interface SectionDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function SectionDetailsPage({
  params,
}: SectionDetailsPageProps) {
  const { id } = await params;
  const session = await requireRole([UserRole.STUDENT]);
  const schoolId = session.user.schoolId;
  const [t, locale] = await Promise.all([
    getTranslations("StudentDashboard.sectionDetails"),
    getLocale(),
  ]);

  if (!schoolId) return notFound();

  // Get student profile
  const studentProfile = await prisma.student.findFirst({
    where: { userId: session.user.id, schoolId },
    select: { id: true, name: true },
  });

  if (!studentProfile) return notFound();

  // Check if student is enrolled in this section
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      schoolId,
      studentId: studentProfile.id,
      sectionId: id,
      status: "ACTIVE",
    },
  });

  if (!enrollment) return notFound();

  // Get section details with all related data
  const section = await prisma.section.findFirst({
    where: {
      id,
      schoolId,
    },
    include: {
      class: true,
      branch: true,
      staffMappings: {
        include: {
          staff: true,
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: true,
        },
      },
      timetables: {
        include: {
          staff: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!section) return notFound();

  const activeEnrollments = section.enrollments.length;
  const isFull = activeEnrollments >= section.capacity;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{section.name}</h1>
        <Button asChild variant="outline">
          <Link href="/student/dashboard">{t("backToDashboard")}</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Section Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("sectionInfo.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t("sectionInfo.class")}
                  </h4>
                  <p className="mt-1">{section.class.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t("sectionInfo.capacity")}
                  </h4>
                  <p className="mt-1">
                    <Badge
                      variant={isFull ? "outline" : "default"}
                      className={
                        isFull ? "text-destructive border-destructive/40" : ""
                      }
                    >
                      {activeEnrollments} / {section.capacity}
                    </Badge>
                  </p>
                </div>
                {section.room && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t("sectionInfo.room")}
                    </h4>
                    <p className="mt-1">{section.room}</p>
                  </div>
                )}
                {section.meetingLink && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t("sectionInfo.meetingLink")}
                    </h4>
                    <p className="mt-1">
                      <a
                        href={section.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4"
                      >
                        {t("sectionInfo.joinMeeting")}
                      </a>
                    </p>
                  </div>
                )}
                {section.branch && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t("sectionInfo.branch")}
                    </h4>
                    <p className="mt-1">{section.branch.name}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t("sectionInfo.enrolledSince")}
                  </h4>
                  <p className="mt-1">
                    {dateFormatter(locale).format(enrollment.enrolledAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>{t("schedule.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {section.timetables.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("schedule.empty")}
                </div>
              ) : (
                <div className="rounded-lg border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("schedule.columns.day")}</TableHead>
                        <TableHead>{t("schedule.columns.time")}</TableHead>
                        <TableHead>{t("schedule.columns.teacher")}</TableHead>
                        <TableHead>{t("schedule.columns.room")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.timetables.map((timetable) => (
                        <TableRow key={timetable.id}>
                          <TableCell className="font-medium">
                            {t(
                              `schedule.days.${timetable.dayOfWeek.toLowerCase()}`,
                            )}
                          </TableCell>
                          <TableCell>
                            {timetable.startTime} - {timetable.endTime}
                          </TableCell>
                          <TableCell>{timetable.staff.name}</TableCell>
                          <TableCell>
                            {timetable.room || (
                              <Badge variant="outline">
                                {t("schedule.noRoom")}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Teachers */}
          <Card>
            <CardHeader>
              <CardTitle>{t("teachers.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {section.staffMappings.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {t("teachers.empty")}
                </div>
              ) : (
                <div className="space-y-3">
                  {section.staffMappings.map((mapping) => (
                    <div
                      key={mapping.staff.id}
                      className="rounded-lg border p-3"
                    >
                      <h4 className="font-medium">{mapping.staff.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {mapping.staff.email}
                      </p>
                      {mapping.staff.phone && (
                        <p className="text-sm text-muted-foreground">
                          {mapping.staff.phone}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Classmates */}
          <Card>
            <CardHeader>
              <CardTitle>{t("classmates.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-3">
                {t("classmates.total", { count: activeEnrollments })}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {section.enrollments.map((enrollment) => (
                  <div
                    key={enrollment.student.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <span className="text-sm">{enrollment.student.name}</span>
                    {enrollment.student.id === studentProfile.id && (
                      <Badge variant="outline">{t("classmates.you")}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
