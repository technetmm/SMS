import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/permissions";
import { UserRole } from "@/app/generated/prisma/enums";
import { ProfileOverview } from "@/components/profile/profile-overview";
import { enumLabel, GENDER_LABELS, STUDENT_STATUS_LABELS } from "@/lib/enum-labels";
import { dateFormatter } from "@/lib/helper";

export default async function StudentProfilePage() {
  const session = await requireRole([UserRole.STUDENT]);
  const schoolId = session.user.schoolId;

  if (!schoolId) {
    redirect("/login");
  }

  const [user, studentProfile, studentStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        emailVerifiedAt: true,
        twoFactorEnabled: true,
      },
    }),
    prisma.student.findFirst({
      where: { userId: session.user.id, schoolId },
      select: {
        id: true,
        branch: { select: { name: true } },
        gender: true,
        dob: true,
        phone: true,
        status: true,
        admissionDate: true,
        fatherName: true,
        motherName: true,
        address: true,
      },
    }),
    prisma.student.findFirst({
      where: { userId: session.user.id, schoolId },
      select: { id: true },
    }).then(async (student) => {
      if (!student) return null;
      const [enrollments, attendanceRecords, pendingInvoices, progressRecords] =
        await Promise.all([
          prisma.enrollment.count({
            where: { schoolId, studentId: student.id, isDeleted: false },
          }),
          prisma.attendance.count({
            where: {
              schoolId,
              enrollment: { studentId: student.id },
            },
          }),
          prisma.invoice.count({
            where: {
              schoolId,
              studentId: student.id,
              status: { in: ["UNPAID", "PARTIAL"] },
              isDeleted: false,
            },
          }),
          prisma.progress.count({
            where: {
              schoolId,
              enrollment: { studentId: student.id },
            },
          }),
        ]);
      return {
        enrollments,
        attendanceRecords,
        pendingInvoices,
        progressRecords,
      };
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileOverview
      heading="Student Profile"
      description="Review your account details and linked student profile."
      user={user}
      accountDetails={[
        {
          label: "Email Verification",
          value: user.emailVerifiedAt ? "Verified" : "Pending",
        },
        {
          label: "Two-Factor Auth",
          value: user.twoFactorEnabled ? "Enabled" : "Disabled",
        },
        {
          label: "Joined",
          value: dateFormatter.format(user.createdAt),
        },
        {
          label: "Last Updated",
          value: dateFormatter.format(user.updatedAt),
        },
      ]}
      profileDetails={[
        {
          label: "Phone",
          value: studentProfile?.phone ?? "-",
        },
        {
          label: "Student Status",
          value: studentProfile?.status
            ? enumLabel(studentProfile.status, STUDENT_STATUS_LABELS)
            : "-",
        },
        {
          label: "Admission Date",
          value: studentProfile?.admissionDate
            ? dateFormatter.format(studentProfile.admissionDate)
            : "-",
        },
        {
          label: "Branch",
          value: studentProfile?.branch?.name ?? "-",
        },
        {
          label: "Gender",
          value: studentProfile?.gender
            ? enumLabel(studentProfile.gender, GENDER_LABELS)
            : "-",
        },
        {
          label: "Date of Birth",
          value: studentProfile?.dob ? dateFormatter.format(studentProfile.dob) : "-",
        },
        {
          label: "Father Name",
          value: studentProfile?.fatherName ?? "-",
        },
        {
          label: "Mother Name",
          value: studentProfile?.motherName ?? "-",
        },
        {
          label: "Address",
          value: studentProfile?.address ?? "-",
        },
      ]}
      stats={[
        {
          label: "Enrollments",
          value: String(studentStats?.enrollments ?? 0),
        },
        {
          label: "Attendance Records",
          value: String(studentStats?.attendanceRecords ?? 0),
        },
        {
          label: "Pending Invoices",
          value: String(studentStats?.pendingInvoices ?? 0),
        },
        {
          label: "Progress Records",
          value: String(studentStats?.progressRecords ?? 0),
        },
      ]}
    />
  );
}
