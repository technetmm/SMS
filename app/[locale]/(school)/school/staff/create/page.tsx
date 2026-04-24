import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StaffForm } from "@/components/staff/staff-form";
import { getTranslations } from "next-intl/server";

export default async function CreateStaffPage() {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.staff");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("create.title")}
        description={t("create.description")}
        actions={
          <Button asChild variant="outline">
            <Link href="/school/staff">{t("create.back")}</Link>
          </Button>
        }
      />
      <StaffForm />
    </div>
  );
}
