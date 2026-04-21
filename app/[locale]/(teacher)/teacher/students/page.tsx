import { Link } from "@/i18n/navigation";
import { EnrollmentStatus } from "@/app/generated/prisma/enums";
import { PageHeader } from "@/components/shared/page-header";
import { TeacherStudentsTable } from "@/components/teacher/teacher-students-table";
import { TeacherAccessFallback } from "@/components/teacher/teacher-access-fallback";
import {
  getTeacherAttendanceFormOptions,
  getTeacherPaginatedStudents,
  requireTeacherAccess,
} from "@/app/(teacher)/teacher/actions";
import { parsePageParam } from "@/lib/pagination";
import { parseTableFilterEnumParam, parseTextParam } from "@/lib/table-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    sectionId?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const q = parseTextParam(params.q);
  const status = parseTableFilterEnumParam(params.status, [
    EnrollmentStatus.ACTIVE,
    EnrollmentStatus.COMPLETED,
    EnrollmentStatus.DROPPED,
  ] as const);

  const [t, commonT, scope, formOptions, rows] = await Promise.all([
    getTranslations("TeacherSite.students"),
    getTranslations("Common"),
    requireTeacherAccess(),
    getTeacherAttendanceFormOptions(),
    getTeacherPaginatedStudents({
      page,
      filters: {
        q,
        sectionId: params.sectionId || undefined,
        status,
      },
    }),
  ]);

  if (!scope.schoolId || !scope.staffId) {
    return <TeacherAccessFallback />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid gap-4 md:grid-cols-4">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">{t("search")}</Label>
              <Input
                id="q"
                name="q"
                defaultValue={q}
                placeholder={t("searchPlaceholder")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sectionId">{t("section")}</Label>
              <select
                id="sectionId"
                name="sectionId"
                defaultValue={params.sectionId ?? ""}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("allSections")}</option>
                {formOptions.sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.class.name} • {section.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">{t("status")}</Label>
              <select
                id="status"
                name="status"
                defaultValue={status ?? ""}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("allStatuses")}</option>
                <option value="ACTIVE">{t("statusOptions.active")}</option>
                <option value="COMPLETED">{t("statusOptions.completed")}</option>
                <option value="DROPPED">{t("statusOptions.dropped")}</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit">{commonT("apply")}</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/teacher/students">{commonT("reset")}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <TeacherStudentsTable
        rows={rows}
        searchParams={{
          q: params.q,
          sectionId: params.sectionId,
          status: params.status,
          page: params.page,
        }}
      />
    </div>
  );
}
