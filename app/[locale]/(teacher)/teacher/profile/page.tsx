import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/permissions";
import { UserRole } from "@/app/generated/prisma/enums";
import { ProfileOverview } from "@/components/profile/profile-overview";
import {
  enumLabel,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  STAFF_STATUS_LABELS,
} from "@/lib/enum-labels";
import { dateFormatter } from "@/lib/formatter";
import { getLocale } from "next-intl/server";

export default async function TeacherProfilePage() {
  const session = await requireRole([UserRole.TEACHER]);
  const schoolId = session.user.schoolId;
  const locale = await getLocale();

  if (!schoolId) {
    redirect("/login");
  }

  const [user, staffProfile, staffStats] = await Promise.all([
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
    prisma.staff.findFirst({
      where: { userId: session.user.id, schoolId },
      select: {
        id: true,
        branch: { select: { name: true } },
        jobTitle: true,
        nrcNumber: true,
        gender: true,
        maritalStatus: true,
        dob: true,
        hireDate: true,
        exitDate: true,
        parmentAddress: true,
        currentAddress: true,
        phone: true,
        status: true,
        remark: true,
        ratePerHour: true,
      },
    }),
    prisma.staff
      .findFirst({
        where: { userId: session.user.id, schoolId },
        select: { id: true },
      })
      .then(async (staff) => {
        if (!staff) return null;
        const [
          assignedSections,
          timetableSlots,
          attendanceMarks,
          payrollRecords,
        ] = await Promise.all([
          prisma.sectionStaff.count({ where: { staffId: staff.id } }),
          prisma.timetable.count({ where: { schoolId, staffId: staff.id } }),
          prisma.staffAttendance.count({
            where: { schoolId, staffId: staff.id },
          }),
          prisma.payroll.count({ where: { schoolId, staffId: staff.id } }),
        ]);
        return {
          assignedSections,
          timetableSlots,
          attendanceMarks,
          payrollRecords,
        };
      }),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileOverview
      heading="Teacher Profile"
      description="Review your account details and linked staff profile."
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
          value: dateFormatter(locale).format(user.createdAt),
        },
        {
          label: "Last Updated",
          value: dateFormatter(locale).format(user.updatedAt),
        },
      ]}
      profileDetails={[
        {
          label: "Job Title",
          value: staffProfile?.jobTitle ?? "-",
        },
        {
          label: "Phone",
          value: staffProfile?.phone ?? "-",
        },
        {
          label: "Staff Status",
          value: staffProfile?.status
            ? enumLabel(staffProfile.status, STAFF_STATUS_LABELS)
            : "-",
        },
        {
          label: "Branch",
          value: staffProfile?.branch?.name ?? "-",
        },
        {
          label: "NRC",
          value: staffProfile?.nrcNumber ?? "-",
        },
        {
          label: "Gender",
          value: staffProfile?.gender
            ? enumLabel(staffProfile.gender, GENDER_LABELS)
            : "-",
        },
        {
          label: "Marital Status",
          value: staffProfile?.maritalStatus
            ? enumLabel(staffProfile.maritalStatus, MARITAL_STATUS_LABELS)
            : "-",
        },
        {
          label: "Date of Birth",
          value: staffProfile?.dob
            ? dateFormatter(locale).format(staffProfile.dob)
            : "-",
        },
        {
          label: "Hire Date",
          value: staffProfile?.hireDate
            ? dateFormatter(locale).format(staffProfile.hireDate)
            : "-",
        },
        {
          label: "Exit Date",
          value: staffProfile?.exitDate
            ? dateFormatter(locale).format(staffProfile.exitDate)
            : "-",
        },
        {
          label: "Permanent Address",
          value: staffProfile?.parmentAddress ?? "-",
        },
        {
          label: "Current Address",
          value: staffProfile?.currentAddress ?? "-",
        },
        {
          label: "Remark",
          value: staffProfile?.remark ?? "-",
        },
        {
          label: "Rate Per Hour",
          value:
            staffProfile?.ratePerHour != null
              ? String(staffProfile.ratePerHour)
              : "-",
        },
      ]}
      stats={[
        {
          label: "Assigned Sections",
          value: String(staffStats?.assignedSections ?? 0),
        },
        {
          label: "Timetable Slots",
          value: String(staffStats?.timetableSlots ?? 0),
        },
        {
          label: "Attendance Marks",
          value: String(staffStats?.attendanceMarks ?? 0),
        },
        {
          label: "Payroll Records",
          value: String(staffStats?.payrollRecords ?? 0),
        },
      ]}
    />
  );
}
