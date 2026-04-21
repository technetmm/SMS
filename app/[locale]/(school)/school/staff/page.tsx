import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StaffTable } from "@/components/staff/staff-table";
import { ExportMenu } from "@/components/shared/export-menu";
import { exportStaffToExcel } from "@/app/(school)/school/exports/actions";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  parseDateRangeParams,
  parseTableFilterEnumParam,
  parseTextParam,
} from "@/lib/table-filters";
import { StaffFilters } from "@/components/staff/staff-filters";
import { getTranslations } from "next-intl/server";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    role?: string;
    status?: string;
    hireFrom?: string;
    hireTo?: string;
  }>;
}) {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.staff");
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const role = parseTableFilterEnumParam(params.role, [
    "SCHOOL_ADMIN",
    "TEACHER",
  ] as const);
  const status = parseTableFilterEnumParam(params.status, [
    "ACTIVE",
    "ONLEAVE",
    "RESIGNED",
    "TERMINATED",
  ] as const);
  const { from: hireFrom, to: hireTo } = parseDateRangeParams({
    from: params.hireFrom,
    to: params.hireTo,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("list.title")}
        description={t("list.description")}
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              items={[
                { label: t("list.exportExcel"), action: exportStaffToExcel },
              ]}
            />
            <Button asChild>
              <Link href="/school/staff/create">{t("list.new")}</Link>
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("list.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffFilters
            q={q}
            status={status}
            role={role}
            hireFrom={params.hireFrom}
            hireTo={params.hireTo}
          />
        </CardContent>
      </Card>
      <StaffTable
        page={page}
        filters={{ q, role, status, hireFrom, hireTo }}
        searchParams={{
          q: params.q,
          role: params.role,
          status: params.status,
          hireFrom: params.hireFrom,
          hireTo: params.hireTo,
          page: params.page,
        }}
      />
    </div>
  );
}
