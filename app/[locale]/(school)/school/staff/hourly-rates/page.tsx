import { requireSchoolAdminAccess } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { StaffHourlyRateManager } from "@/components/staff/staff-hourly-rate-manager";
import { getStaffWithHourlyRates } from "@/app/(school)/school/staff/actions";
import { getTranslations } from "next-intl/server";

export default async function StaffHourlyRatesPage() {
  await requireSchoolAdminAccess();
  const [t, staff] = await Promise.all([
    getTranslations("SchoolEntities.staff.hourlyRates"),
    getStaffWithHourlyRates(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <StaffHourlyRateManager
        staff={staff.map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          currentHourlyRate: Number(s.ratePerHour || 0),
          status: s.status,
        }))}
        currency={staff[0]?.tenant?.currency || "USD"}
      />
    </div>
  );
}
