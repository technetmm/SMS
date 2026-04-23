import { PaymentStatus, UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentDashboardPage() {
  const session = await requireRole([UserRole.STUDENT]);
  const schoolId = session.user.schoolId;

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
          Your student profile is not linked yet. Please contact your school admin.
        </CardContent>
      </Card>
    );
  }

  const [enrollmentCount, attendanceSummary, unpaidInvoices] = await Promise.all([
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
      <h1 className="text-2xl font-semibold">Student Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Enrollments</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{enrollmentCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Records</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {attendanceSummary._count.id}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{unpaidInvoices}</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {studentProfile.name}</CardTitle>
        </CardHeader>
        <CardContent>
          This dashboard is read-only. You can view your schedule, attendance, fees, and progress.
        </CardContent>
      </Card>
    </div>
  );
}
