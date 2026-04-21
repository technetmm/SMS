import { DeviceApprovalTable } from "@/components/auth/device-approval-table";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { getPaginatedPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";
import { parsePageParam } from "@/lib/pagination";
import { requireSchoolAdminAccess } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { parseDateRangeParams, parseTextParam } from "@/lib/table-filters";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";

export default async function SchoolDeviceApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    createdFrom?: string;
    createdTo?: string;
    expiresFrom?: string;
    expiresTo?: string;
  }>;
}) {
  const user = await requireSchoolAdminAccess();
  const [t, locale] = await Promise.all([
    getTranslations("DeviceApprovalsPage"),
    getLocale(),
  ]);
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const createdRange = parseDateRangeParams({
    from: params.createdFrom,
    to: params.createdTo,
  });
  const expiresRange = parseDateRangeParams({
    from: params.expiresFrom,
    to: params.expiresTo,
  });

  const requests = await getPaginatedPendingDeviceApprovalRows(
    {
      role: user.role,
      schoolId: user.schoolId,
    },
    {
      page,
      filters: {
        q,
        createdFrom: createdRange.from,
        createdTo: createdRange.to,
        expiresFrom: expiresRange.from,
        expiresTo: expiresRange.to,
      },
    },
  );
  const tableMessages = {
    errors: {
      unableToProcess: t("table.errors.unableToProcess"),
    },
    success: {
      approved: t("table.success.approved"),
      denied: t("table.success.denied"),
    },
    columns: {
      requester: t("table.columns.requester"),
      role: t("table.columns.role"),
      school: t("table.columns.school"),
      requested: t("table.columns.requested"),
      expires: t("table.columns.expires"),
      deviceIp: t("table.columns.deviceIp"),
      status: t("table.columns.status"),
      actions: t("table.columns.actions"),
    },
    roleLabels: {
      superAdmin: t("table.roleLabels.superAdmin"),
      schoolSuperAdmin: t("table.roleLabels.schoolSuperAdmin"),
      schoolAdmin: t("table.roleLabels.schoolAdmin"),
      teacher: t("table.roleLabels.teacher"),
      student: t("table.roleLabels.student"),
    },
    fallbacks: {
      unnamedUser: t("table.fallbacks.unnamedUser"),
      notAvailable: t("table.fallbacks.notAvailable"),
    },
    actions: {
      deny: t("table.actions.deny"),
      denying: t("table.actions.denying"),
      approve: t("table.actions.approve"),
      approving: t("table.actions.approving"),
    },
    empty: t("table.empty"),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("school.title")}
        description={t("school.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("filters.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">{t("filters.search.label")}</Label>
              <Input
                id="q"
                name="q"
                defaultValue={q}
                placeholder={t("filters.search.placeholder.school")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdFrom">{t("filters.requestedFrom")}</Label>
              <Input
                id="createdFrom"
                name="createdFrom"
                type="date"
                defaultValue={parseTextParam(params.createdFrom)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdTo">{t("filters.requestedTo")}</Label>
              <Input
                id="createdTo"
                name="createdTo"
                type="date"
                defaultValue={parseTextParam(params.createdTo)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresFrom">{t("filters.expiresFrom")}</Label>
              <Input
                id="expiresFrom"
                name="expiresFrom"
                type="date"
                defaultValue={parseTextParam(params.expiresFrom)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresTo">{t("filters.expiresTo")}</Label>
              <Input
                id="expiresTo"
                name="expiresTo"
                type="date"
                defaultValue={parseTextParam(params.expiresTo)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">{t("filters.apply")}</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/school/device-approvals">
                  {t("filters.reset")}
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-background">
        <DeviceApprovalTable
          initialRequests={requests.items}
          locale={locale}
          messages={tableMessages}
        />
        <TablePagination
          pagination={requests}
          pathname="/school/device-approvals"
          searchParams={{
            q: params.q,
            createdFrom: params.createdFrom,
            createdTo: params.createdTo,
            expiresFrom: params.expiresFrom,
            expiresTo: params.expiresTo,
            page: params.page,
          }}
        />
      </div>
    </div>
  );
}
