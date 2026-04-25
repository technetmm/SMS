import { UserRole } from "@/app/generated/prisma/enums";
import { DeviceApprovalTable } from "@/components/auth/device-approval-table";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { getPaginatedPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";
import { parsePageParam } from "@/lib/pagination";
import { requireSuperAdminAccess } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TableFilterSelect } from "@/components/shared/table-filter-select";
import { Link } from "@/i18n/navigation";
import {
  parseDateRangeParams,
  parseTableFilterEnumParam,
  parseTextParam,
  TABLE_FILTER_ALL_VALUE,
} from "@/lib/table-filters";
import { getLocale, getTranslations } from "next-intl/server";

export default async function PlatformDeviceApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    requesterRole?: string;
    createdFrom?: string;
    createdTo?: string;
  }>;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("DeviceApprovalsPage"),
    getLocale(),
  ]);
  await requireSuperAdminAccess();
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const requesterRole = parseTableFilterEnumParam(params.requesterRole, [
    UserRole.SCHOOL_SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  ] as const);
  const createdRange = parseDateRangeParams({
    from: params.createdFrom,
    to: params.createdTo,
  });
  const requests = await getPaginatedPendingDeviceApprovalRows(
    {
      role: UserRole.SUPER_ADMIN,
    },
    {
      page,
      filters: {
        q,
        requesterRole,
        createdFrom: createdRange.from,
        createdTo: createdRange.to,
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
        title={t("platform.title")}
        description={t("platform.description")}
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
                placeholder={t("filters.search.placeholder.platform")}
              />
            </div>
            <TableFilterSelect
              id="requesterRole"
              name="requesterRole"
              label={t("filters.requesterRole.label")}
              placeholder={t("filters.requesterRole.placeholder")}
              defaultValue={params.requesterRole ?? TABLE_FILTER_ALL_VALUE}
              options={[
                {
                  value: "SCHOOL_SUPER_ADMIN",
                  label: t("filters.requesterRole.options.schoolSuperAdmin"),
                },
                {
                  value: "SCHOOL_ADMIN",
                  label: t("filters.requesterRole.options.schoolAdmin"),
                },
                {
                  value: "TEACHER",
                  label: t("filters.requesterRole.options.teacher"),
                },
                {
                  value: "STUDENT",
                  label: t("filters.requesterRole.options.student"),
                },
              ]}
            />
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
            <div className="flex items-end gap-2">
              <Button type="submit">{t("filters.apply")}</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/platform/device-approvals">
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
          showSchool
          locale={locale}
          messages={tableMessages}
        />
        <TablePagination
          pagination={requests}
          pathname="/platform/device-approvals"
          searchParams={{
            q: params.q,
            requesterRole: params.requesterRole,
            createdFrom: params.createdFrom,
            createdTo: params.createdTo,
            page: params.page,
          }}
        />
      </div>
    </div>
  );
}
