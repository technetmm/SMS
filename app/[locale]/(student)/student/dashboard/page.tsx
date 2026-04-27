import { PaymentStatus, UserRole } from "@/app/generated/prisma/enums";
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
import { StudentSections } from "@/components/student/student-sections";
import { StudentTimetable } from "@/components/student/student-timetable";
import { getTranslations } from "next-intl/server";

export default async function StudentDashboardPage() {
  const session = await requireRole([UserRole.STUDENT]);
  const schoolId = session.user.schoolId;
  const t = await getTranslations("StudentDashboard");

  if (!schoolId) return null;

  const studentProfile = await prisma.student.findFirst({
    where: { userId: session.user.id, schoolId },
    select: { id: true, name: true },
  });

  if (!studentProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          Your student profile is not linked yet. Please contact your school
          admin.
        </CardContent>
      </Card>
    );
  }

  const [enrollmentCount, attendanceSummary, unpaidInvoices] =
    await Promise.all([
      prisma.enrollment.count({
        where: { schoolId, studentId: studentProfile.id },
      }),
      prisma.attendance.aggregate({
        _count: { id: true },
        where: {
          schoolId,
          enrollment: { studentId: studentProfile.id },
        },
      }),
      prisma.invoice.count({
        where: {
          schoolId,
          studentId: studentProfile.id,
          status: { in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] },
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("stats.activeEnrollments")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {enrollmentCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("stats.attendanceRecords")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {attendanceSummary._count.id}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("stats.pendingInvoices")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {unpaidInvoices}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StudentSections studentId={studentProfile.id} schoolId={schoolId} />
        <StudentTimetable studentId={studentProfile.id} schoolId={schoolId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("welcome.title", { name: studentProfile.name })}
          </CardTitle>
        </CardHeader>
        <CardContent>{t("welcome.description")}</CardContent>
      </Card>
    </div>
  );
}
