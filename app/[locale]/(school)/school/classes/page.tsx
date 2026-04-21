import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ClassTable } from "@/components/classes/class-table";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  parseDateRangeParams,
  parseNumberParam,
  parseTableFilterEnumParam,
  parseTextParam,
} from "@/lib/table-filters";
import { ClassFilters } from "@/components/classes/class-filters";
import { getTranslations } from "next-intl/server";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    classType?: string;
    programType?: string;
    billingType?: string;
    createdFrom?: string;
    createdTo?: string;
    feeMin?: string;
    feeMax?: string;
  }>;
}) {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.classes");
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const classType = parseTableFilterEnumParam(params.classType, [
    "ONE_ON_ONE",
    "PRIVATE",
    "GROUP",
  ] as const);
  const programType = parseTableFilterEnumParam(params.programType, [
    "REGULAR",
    "INTENSIVE",
  ] as const);
  const billingType = parseTableFilterEnumParam(params.billingType, [
    "ONE_TIME",
    "MONTHLY",
  ] as const);
  const { from: createdFrom, to: createdTo } = parseDateRangeParams({
    from: params.createdFrom,
    to: params.createdTo,
  });
  const feeMin = parseNumberParam(params.feeMin);
  const feeMax = parseNumberParam(params.feeMax);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("list.title")}
        description={t("list.description")}
        actions={
          <Button asChild>
            <Link href="/school/classes/create">{t("list.new")}</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("list.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassFilters
            q={q}
            classType={classType}
            programType={programType}
            billingType={billingType}
            createdFrom={params.createdFrom}
            createdTo={params.createdTo}
            feeMin={params.feeMin}
            feeMax={params.feeMax}
          />
        </CardContent>
      </Card>
      <ClassTable
        page={page}
        filters={{
          q,
          classType,
          programType,
          billingType,
          createdFrom,
          createdTo,
          feeMin,
          feeMax,
        }}
        searchParams={{
          q: params.q,
          classType: params.classType,
          programType: params.programType,
          billingType: params.billingType,
          createdFrom: params.createdFrom,
          createdTo: params.createdTo,
          feeMin: params.feeMin,
          feeMax: params.feeMax,
          page: params.page,
        }}
      />
    </div>
  );
}
