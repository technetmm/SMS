import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherDashboardTimetableGrid } from "@/components/teacher/teacher-dashboard-timetable-grid";
import { getAppStartOfMonthUtc } from "@/lib/app-time";
import { requireTeacherAccess } from "@/app/(teacher)/teacher/actions";

export default async function TeacherDashboardPage() {
  const scope = await requireTeacherAccess();
  const schoolId = scope.schoolId;

  if (!schoolId) return null;

  const staffProfile = await prisma.staff.findFirst({
    where: { userId: scope.userId, schoolId },
    select: { id: true, name: true },
  });

  if (!staffProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teacher Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          Your staff profile is not linked yet. Please contact your school
          admin.
        </CardContent>
      </Card>
    );
  }

  const startOfMonth = getAppStartOfMonthUtc();

  const [sectionCount, timetableCount, attendanceCount, timetableSlots] =
    await Promise.all([
      prisma.sectionStaff.count({
        where: {
          staffId: staffProfile.id,
          section: { schoolId },
        },
      }),
      prisma.timetable.count({
        where: { schoolId, staffId: staffProfile.id },
      }),
      prisma.staffAttendance.count({
        where: {
          schoolId,
          staffId: staffProfile.id,
          date: { gte: startOfMonth },
        },
      }),
      prisma.timetable.findMany({
        where: { schoolId, staffId: staffProfile.id },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          room: true,
          section: {
            select: {
              id: true,
              name: true,
              class: { select: { name: true } },
            },
          },
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Teacher Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assigned Sections</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {sectionCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Timetable Slots</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {timetableCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Attendance Marks (Month)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {attendanceCount}
          </CardContent>
        </Card>
      </div>

      <TeacherDashboardTimetableGrid slots={timetableSlots} timeZone={scope.timeZone} />

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {staffProfile.name}</CardTitle>
        </CardHeader>
        <CardContent>
          Use the sidebar to access your classes, timetable, and attendance
          views.
        </CardContent>
      </Card>
    </div>
  );
}
