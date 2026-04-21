import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StudentTable } from "@/components/students/student-table";
import { StudentFilters } from "@/components/students/student-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportMenu } from "@/components/shared/export-menu";
import { exportStudentsToExcel } from "@/app/(school)/school/exports/actions";
import { StudentStatus } from "@/app/generated/prisma/enums";
import { parsePageParam } from "@/lib/pagination";
import {
  parseDateRangeParams,
  parseTableFilterEnumParam,
  parseTextParam,
} from "@/lib/table-filters";
import { getTranslations } from "next-intl/server";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    gender?: string;
    admissionFrom?: string;
    admissionTo?: string;
    page?: string;
  }>;
}) {
  await requireSchoolAdmin();
  const t = await getTranslations("SchoolEntities.students");

  const { q, status: paramsStatus, gender: paramsGender, admissionFrom: admissionFromParam, admissionTo: admissionToParam, page: pageParam } = await searchParams;

  const query = typeof q === "string" ? q : "";
  const status =
    parseTableFilterEnumParam(paramsStatus, [
      StudentStatus.ACTIVE,
      StudentStatus.INACTIVE,
      StudentStatus.GRADUATED,
    ] as const) ?? "ALL";
  const gender =
    parseTableFilterEnumParam(paramsGender, [
      "MALE",
      "FEMALE",
      "OTHER",
    ] as const) ?? "ALL";
  const { from: admissionFrom, to: admissionTo } = parseDateRangeParams({
    from: admissionFromParam,
    to: admissionToParam,
  });
  const page = parsePageParam(pageParam);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("list.title")}
        description={t("list.description")}
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              items={[{ label: t("list.exportExcel"), action: exportStudentsToExcel }]}
            />
            <Button asChild>
              <Link href="/school/students/create">{t("list.new")}</Link>
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("list.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentFilters
            query={query}
            status={status}
            gender={gender}
            admissionFrom={parseTextParam(admissionFromParam)}
            admissionTo={parseTextParam(admissionToParam)}
          />
        </CardContent>
      </Card>
      <StudentTable
        page={page}
        query={query}
        status={status as StudentStatus | "ALL"}
        gender={gender as "ALL" | "MALE" | "FEMALE" | "OTHER"}
        admissionFrom={admissionFrom}
        admissionTo={admissionTo}
        searchParams={{
          q: query || undefined,
          status,
          gender,
          admissionFrom: admissionFromParam,
          admissionTo: admissionToParam,
          page: pageParam,
        }}
      />
    </div>
  );
}
