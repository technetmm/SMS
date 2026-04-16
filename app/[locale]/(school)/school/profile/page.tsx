import { redirect } from "next/navigation";
import { getServerAuth } from "@/auth";
import { Plan, UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { ProfileOverview } from "@/components/profile/profile-overview";
import { enumLabel, PLAN_LABELS } from "@/lib/enum-labels";
import { dateFormatter } from "@/lib/helper";

export default async function SchoolProfilePage() {
  const session = await getServerAuth();
  if (
    !session?.user?.id ||
    !session.user.schoolId ||
    (session.user.role !== UserRole.SCHOOL_SUPER_ADMIN &&
      session.user.role !== UserRole.SCHOOL_ADMIN)
  ) {
    redirect("/login");
  }

  const [user, school, schoolStats] = await Promise.all([
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
        isSchoolOwner: true,
      },
    }),
    session.user.role === UserRole.SCHOOL_SUPER_ADMIN
      ? prisma.tenant.findFirst({
          where: { id: session.user.schoolId },
          select: {
            name: true,
            slug: true,
            currency: true,
            plan: true,
            billingDayOfMonth: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : Promise.resolve(null),
    session.user.role === UserRole.SCHOOL_SUPER_ADMIN
      ? Promise.all([
          prisma.user.count({
            where: { schoolId: session.user.schoolId, isDeleted: false },
          }),
          prisma.staff.count({
            where: { schoolId: session.user.schoolId, isDeleted: false },
          }),
          prisma.student.count({
            where: { schoolId: session.user.schoolId, isDeleted: false },
          }),
          prisma.class.count({
            where: { schoolId: session.user.schoolId, isDeleted: false },
          }),
          prisma.section.count({
            where: { schoolId: session.user.schoolId, isDeleted: false },
          }),
          prisma.subscription.count({
            where: { schoolId: session.user.schoolId, isActive: true },
          }),
        ])
      : Promise.resolve(null),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileOverview
      heading="Your Profile"
      description="Review your account details and school workspace information."
      settingsBasePath="/school/settings"
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
        {
          label: "School Access",
          value: "Yes",
        },
      ]}
      profileDetails={[
        {
          label: "Owner Access",
          value: user.isSchoolOwner ? "Yes" : "No",
        },
      ]}
      schoolInfo={
        school
          ? {
              ...school,
              plan: enumLabel(school.plan ?? Plan.FREE, PLAN_LABELS),
            }
          : null
      }
      stats={
        schoolStats
          ? [
              { label: "Users", value: String(schoolStats[0]) },
              { label: "Staff", value: String(schoolStats[1]) },
              { label: "Students", value: String(schoolStats[2]) },
              { label: "Classes", value: String(schoolStats[3]) },
              { label: "Sections", value: String(schoolStats[4]) },
              { label: "Active Subs", value: String(schoolStats[5]) },
            ]
          : []
      }
    />
  );
}
