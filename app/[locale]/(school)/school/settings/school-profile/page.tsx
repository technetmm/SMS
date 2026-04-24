import { getLocale, getTranslations } from "next-intl/server";
import { getServerAuth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SchoolProfileForm } from "@/components/settings/school-profile-form";
import { UserRole } from "@/app/generated/prisma/enums";
import { redirect } from "@/i18n/navigation";

export default async function SchoolProfilePage() {
  const locale = await getLocale();
  const t = await getTranslations("SettingsPages.schoolProfile");
  const session = await getServerAuth();
  const sessionUser = session?.user;
  if (!sessionUser?.id || !sessionUser.schoolId) {
    redirect({ href: "/login", locale });
  }
  const verifiedSessionUser = sessionUser!;
  const schoolId = verifiedSessionUser.schoolId!;

  const [user, tenant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: verifiedSessionUser.id },
      select: { isSchoolOwner: true, role: true, schoolId: true },
    }),
    prisma.tenant.findFirst({
      where: { id: schoolId },
      select: {
        name: true,
        slug: true,
        currency: true,
        isActive: true,
        billingDayOfMonth: true,
      },
    }),
  ]);

  if (!user || !tenant || !user.schoolId) {
    redirect({ href: "/login", locale });
  }
  const currentUser = user!;
  const currentTenant = tenant!;

  const canEdit =
    (currentUser.role === UserRole.SCHOOL_SUPER_ADMIN ||
      currentUser.role === UserRole.SCHOOL_ADMIN) &&
    currentUser.isSchoolOwner;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <SchoolProfileForm tenant={currentTenant} canEdit={canEdit} />
    </div>
  );
}
