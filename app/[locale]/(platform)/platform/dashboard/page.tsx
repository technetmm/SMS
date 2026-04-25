import {
  getActivityLogs,
  getPlatformDashboardData,
} from "@/app/(platform)/actions";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DeviceApprovalTable } from "@/components/auth/device-approval-table";
import { StatCard } from "@/components/shared/stat-card";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlatformRevenueChart } from "@/components/platform/platform-revenue-chart";
import { parsePageParam } from "@/lib/pagination";
import { getLocale, getTranslations } from "next-intl/server";

export default async function PlatformDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    devicePage?: string;
    schoolsPage?: string;
    subscriptionsPage?: string;
  }>;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("PlatformDashboard"),
    getLocale(),
  ]);
  const params = await searchParams;
  const devicePage = parsePageParam(params.devicePage);
  const schoolsPage = parsePageParam(params.schoolsPage);
  const subscriptionsPage = parsePageParam(params.subscriptionsPage);

  const [data, activityLogs] = await Promise.all([
    getPlatformDashboardData({
      devicePage,
      schoolsPage,
      subscriptionsPage,
    }),
    getActivityLogs(),
  ]);

  const now = new Date();
  const chartData = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      month: date.toLocaleString(locale, { month: "short" }),
      revenue: Math.max(0, data.monthlyRevenue - (5 - index) * 20),
      schools: Math.max(1, data.totalSchools - (5 - index)),
    };
  });
  const deviceTableMessages = {
    errors: {
      unableToProcess: t("deviceTable.errors.unableToProcess"),
    },
    success: {
      approved: t("deviceTable.success.approved"),
      denied: t("deviceTable.success.denied"),
    },
    columns: {
      requester: t("deviceTable.columns.requester"),
      role: t("deviceTable.columns.role"),
      school: t("deviceTable.columns.school"),
      requested: t("deviceTable.columns.requested"),
      deviceIp: t("deviceTable.columns.deviceIp"),
      status: t("deviceTable.columns.status"),
      actions: t("deviceTable.columns.actions"),
    },
    roleLabels: {
      superAdmin: t("deviceTable.roleLabels.superAdmin"),
      schoolSuperAdmin: t("deviceTable.roleLabels.schoolSuperAdmin"),
      schoolAdmin: t("deviceTable.roleLabels.schoolAdmin"),
      teacher: t("deviceTable.roleLabels.teacher"),
      student: t("deviceTable.roleLabels.student"),
    },
    fallbacks: {
      unnamedUser: t("deviceTable.fallbacks.unnamedUser"),
      notAvailable: t("deviceTable.fallbacks.notAvailable"),
    },
    actions: {
      deny: t("deviceTable.actions.deny"),
      denying: t("deviceTable.actions.denying"),
      approve: t("deviceTable.actions.approve"),
      approving: t("deviceTable.actions.approving"),
    },
    empty: t("deviceTable.empty"),
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={t("stats.totalSchools")}
          value={String(data.totalSchools)}
        />
        <StatCard
          title={t("stats.activeSubscriptions")}
          value={String(data.activeSubscriptions)}
        />
        <StatCard
          title={t("stats.monthlyRevenue")}
          value={`$${Number(data.monthlyRevenue).toFixed(2)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <PlatformRevenueChart
          data={chartData}
          title={t("charts.revenueTrend")}
        />
        <div className="rounded-lg border bg-background p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t("highlights.title")}
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              {t("highlights.totalSchools", { count: data.totalSchools })}
            </li>
            <li>
              {t("highlights.activeSubscriptions", {
                count: data.activeSubscriptions,
              })}
            </li>
            <li>
              {t("highlights.latestGrowth", {
                count: chartData.at(-1)?.schools ?? data.totalSchools,
              })}
            </li>
          </ul>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("deviceApprovals.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceApprovalTable
            initialRequests={data.deviceApprovalRequests.items}
            showSchool
            locale={locale}
            messages={deviceTableMessages}
          />
          <TablePagination
            pagination={data.deviceApprovalRequests}
            pathname="/platform/dashboard"
            searchParams={{
              schoolsPage: params.schoolsPage,
              subscriptionsPage: params.subscriptionsPage,
            }}
            pageParamName="devicePage"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("schools.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("schools.columns.name")}</TableHead>
                  <TableHead>{t("schools.columns.plan")}</TableHead>
                  <TableHead>{t("schools.columns.status")}</TableHead>
                  <TableHead>{t("schools.columns.created")}</TableHead>
                  <TableHead className="text-right">
                    {t("schools.columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tenants.items.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.plan}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.isActive ? "default" : "outline"}>
                        {tenant.isActive
                          ? t("schools.status.active")
                          : t("schools.status.disabled")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(tenant.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          {t("schools.actions.view")}
                        </Button>
                        <Button size="sm" variant="ghost">
                          {t("schools.actions.disable")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data.tenants.totalCount === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      {t("schools.empty")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            <TablePagination
              pagination={data.tenants}
              pathname="/platform/dashboard"
              searchParams={{
                devicePage: params.devicePage,
                subscriptionsPage: params.subscriptionsPage,
              }}
              pageParamName="schoolsPage"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("subscriptions.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("subscriptions.columns.school")}</TableHead>
                  <TableHead>{t("subscriptions.columns.plan")}</TableHead>
                  <TableHead>{t("subscriptions.columns.status")}</TableHead>
                  <TableHead>
                    {t("subscriptions.columns.nextBilling")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.subscriptions.items.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">
                      {subscription.tenant.name}
                    </TableCell>
                    <TableCell>{subscription.plan}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          subscription.status === "ACTIVE"
                            ? "default"
                            : "outline"
                        }
                      >
                        {subscription.status === "ACTIVE"
                          ? t("subscriptions.status.active")
                          : subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(subscription.currentPeriodEnd)}
                    </TableCell>
                  </TableRow>
                ))}
                {data.subscriptions.totalCount === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      {t("subscriptions.empty")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            <TablePagination
              pagination={data.subscriptions}
              pathname="/platform/dashboard"
              searchParams={{
                devicePage: params.devicePage,
                schoolsPage: params.schoolsPage,
              }}
              pageParamName="subscriptionsPage"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("activity.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline
            items={activityLogs}
            locale={locale}
            messages={{
              empty: t("activity.empty"),
              system: t("activity.system"),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
