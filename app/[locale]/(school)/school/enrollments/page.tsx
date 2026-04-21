import Link from "next/link";
import { requireSchoolAdminAccess } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EnrollmentTable } from "@/components/enrollments/enrollment-table";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  parseDateRangeParams,
  parseTableFilterEnumParam,
  parseTextParam,
} from "@/lib/table-filters";
import { EnrollmentStatus } from "@/app/generated/prisma/enums";
import { EnrollmentFilters } from "@/components/enrollments/enrollment-filters";
import { getTranslations } from "next-intl/server";

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    enrolledFrom?: string;
    enrolledTo?: string;
  }>;
}) {
  await requireSchoolAdminAccess();
  const t = await getTranslations("SchoolEntities.enrollments");
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const status = parseTableFilterEnumParam(params.status, [
    EnrollmentStatus.ACTIVE,
    EnrollmentStatus.COMPLETED,
    EnrollmentStatus.DROPPED,
  ] as const);
  const { from: enrolledFrom, to: enrolledTo } = parseDateRangeParams({
    from: params.enrolledFrom,
    to: params.enrolledTo,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("list.title")}
        description={t("list.description")}
        actions={
          <Button asChild>
            <Link href="/school/enrollments/create">{t("list.new")}</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("list.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <EnrollmentFilters
            q={q}
            status={status}
            enrolledFrom={params.enrolledFrom}
            enrolledTo={params.enrolledTo}
          />
        </CardContent>
      </Card>
      <EnrollmentTable
        page={page}
        filters={{ q, status, enrolledFrom, enrolledTo }}
        searchParams={{
          q: params.q,
          status: params.status,
          enrolledFrom: params.enrolledFrom,
          enrolledTo: params.enrolledTo,
          page: params.page,
        }}
      />
    </div>
  );
}
