import { redirect } from "next/navigation";
import { getServerAuth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SchoolProfileForm } from "@/components/settings/school-profile-form";
import { UserRole } from "@/app/generated/prisma/enums";

export default async function SchoolProfilePage() {
  const session = await getServerAuth();
  if (!session?.user?.id || !session.user.schoolId) {
    redirect("/login");
  }

  const [user, tenant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSchoolOwner: true, role: true, schoolId: true },
    }),
    prisma.tenant.findFirst({
      where: { id: session.user.schoolId },
      select: { name: true, slug: true, isActive: true, billingDayOfMonth: true },
    }),
  ]);

  if (!user || !tenant || !user.schoolId) {
    redirect("/login");
  }

  const canEdit = user.role === UserRole.SCHOOL_ADMIN && user.isSchoolOwner;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          School
        </p>
        <h2 className="text-2xl font-semibold">School Info</h2>
        <p className="text-sm text-muted-foreground">
          Manage tenant profile fields for your school.
        </p>
      </div>

      <SchoolProfileForm tenant={tenant} canEdit={canEdit} />
    </div>
  );
}
