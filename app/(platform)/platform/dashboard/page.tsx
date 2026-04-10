import {
  getActivityLogs,
  getPlatformDashboardData,
} from "@/app/(platform)/actions";
import { Plan, SubscriptionStatus, UserRole } from "@/app/generated/prisma/enums";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { parseDateRangeParams, parseEnumParam, parseTextParam } from "@/lib/table-filters";

function setIfPresent(params: URLSearchParams, key: string, value: string | undefined) {
  if (value && value.length > 0) {
    params.set(key, value);
  }
}

function hrefWithQuery(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default async function PlatformDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    devicePage?: string;
    schoolsPage?: string;
    subscriptionsPage?: string;
    device_q?: string;
    device_requesterRole?: string;
    device_createdFrom?: string;
    device_createdTo?: string;
    device_expiresFrom?: string;
    device_expiresTo?: string;
    schools_q?: string;
    schools_plan?: string;
    schools_isActive?: string;
    schools_createdFrom?: string;
    schools_createdTo?: string;
    subscriptions_q?: string;
    subscriptions_plan?: string;
    subscriptions_status?: string;
    subscriptions_isActive?: string;
    subscriptions_periodFrom?: string;
    subscriptions_periodTo?: string;
  }>;
}) {
  const params = await searchParams;
  const devicePage = parsePageParam(params.devicePage);
  const schoolsPage = parsePageParam(params.schoolsPage);
  const subscriptionsPage = parsePageParam(params.subscriptionsPage);

  const deviceQ = parseTextParam(params.device_q);
  const deviceRequesterRole = parseEnumParam(params.device_requesterRole, [
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  ] as const);
  const deviceCreatedRange = parseDateRangeParams({
    from: params.device_createdFrom,
    to: params.device_createdTo,
  });
  const deviceExpiresRange = parseDateRangeParams({
    from: params.device_expiresFrom,
    to: params.device_expiresTo,
  });

  const schoolsQ = parseTextParam(params.schools_q);
  const schoolsPlan = parseEnumParam(params.schools_plan, [
    Plan.FREE,
    Plan.BASIC,
    Plan.PREMIUM,
  ] as const);
  const schoolsIsActiveRaw = parseEnumParam(params.schools_isActive, ["true", "false"] as const);
  const schoolsIsActive = schoolsIsActiveRaw == null ? undefined : schoolsIsActiveRaw === "true";
  const schoolsCreatedRange = parseDateRangeParams({
    from: params.schools_createdFrom,
    to: params.schools_createdTo,
  });

  const subscriptionsQ = parseTextParam(params.subscriptions_q);
  const subscriptionsPlan = parseEnumParam(params.subscriptions_plan, [
    Plan.FREE,
    Plan.BASIC,
    Plan.PREMIUM,
  ] as const);
  const subscriptionsStatus = parseEnumParam(params.subscriptions_status, [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAST_DUE,
    SubscriptionStatus.CANCELED,
  ] as const);
  const subscriptionsIsActiveRaw = parseEnumParam(params.subscriptions_isActive, ["true", "false"] as const);
  const subscriptionsIsActive =
    subscriptionsIsActiveRaw == null ? undefined : subscriptionsIsActiveRaw === "true";
  const subscriptionsPeriodRange = parseDateRangeParams({
    from: params.subscriptions_periodFrom,
    to: params.subscriptions_periodTo,
  });

  const deviceResetParams = new URLSearchParams();
  setIfPresent(deviceResetParams, "schoolsPage", params.schoolsPage);
  setIfPresent(deviceResetParams, "subscriptionsPage", params.subscriptionsPage);
  setIfPresent(deviceResetParams, "schools_q", params.schools_q);
  setIfPresent(deviceResetParams, "schools_plan", params.schools_plan);
  setIfPresent(deviceResetParams, "schools_isActive", params.schools_isActive);
  setIfPresent(deviceResetParams, "schools_createdFrom", params.schools_createdFrom);
  setIfPresent(deviceResetParams, "schools_createdTo", params.schools_createdTo);
  setIfPresent(deviceResetParams, "subscriptions_q", params.subscriptions_q);
  setIfPresent(deviceResetParams, "subscriptions_plan", params.subscriptions_plan);
  setIfPresent(deviceResetParams, "subscriptions_status", params.subscriptions_status);
  setIfPresent(deviceResetParams, "subscriptions_isActive", params.subscriptions_isActive);
  setIfPresent(deviceResetParams, "subscriptions_periodFrom", params.subscriptions_periodFrom);
  setIfPresent(deviceResetParams, "subscriptions_periodTo", params.subscriptions_periodTo);

  const schoolsResetParams = new URLSearchParams();
  setIfPresent(schoolsResetParams, "devicePage", params.devicePage);
  setIfPresent(schoolsResetParams, "subscriptionsPage", params.subscriptionsPage);
  setIfPresent(schoolsResetParams, "device_q", params.device_q);
  setIfPresent(schoolsResetParams, "device_requesterRole", params.device_requesterRole);
  setIfPresent(schoolsResetParams, "device_createdFrom", params.device_createdFrom);
  setIfPresent(schoolsResetParams, "device_createdTo", params.device_createdTo);
  setIfPresent(schoolsResetParams, "device_expiresFrom", params.device_expiresFrom);
  setIfPresent(schoolsResetParams, "device_expiresTo", params.device_expiresTo);
  setIfPresent(schoolsResetParams, "subscriptions_q", params.subscriptions_q);
  setIfPresent(schoolsResetParams, "subscriptions_plan", params.subscriptions_plan);
  setIfPresent(schoolsResetParams, "subscriptions_status", params.subscriptions_status);
  setIfPresent(schoolsResetParams, "subscriptions_isActive", params.subscriptions_isActive);
  setIfPresent(schoolsResetParams, "subscriptions_periodFrom", params.subscriptions_periodFrom);
  setIfPresent(schoolsResetParams, "subscriptions_periodTo", params.subscriptions_periodTo);

  const subscriptionsResetParams = new URLSearchParams();
  setIfPresent(subscriptionsResetParams, "devicePage", params.devicePage);
  setIfPresent(subscriptionsResetParams, "schoolsPage", params.schoolsPage);
  setIfPresent(subscriptionsResetParams, "device_q", params.device_q);
  setIfPresent(subscriptionsResetParams, "device_requesterRole", params.device_requesterRole);
  setIfPresent(subscriptionsResetParams, "device_createdFrom", params.device_createdFrom);
  setIfPresent(subscriptionsResetParams, "device_createdTo", params.device_createdTo);
  setIfPresent(subscriptionsResetParams, "device_expiresFrom", params.device_expiresFrom);
  setIfPresent(subscriptionsResetParams, "device_expiresTo", params.device_expiresTo);
  setIfPresent(subscriptionsResetParams, "schools_q", params.schools_q);
  setIfPresent(subscriptionsResetParams, "schools_plan", params.schools_plan);
  setIfPresent(subscriptionsResetParams, "schools_isActive", params.schools_isActive);
  setIfPresent(subscriptionsResetParams, "schools_createdFrom", params.schools_createdFrom);
  setIfPresent(subscriptionsResetParams, "schools_createdTo", params.schools_createdTo);

  const [data, activityLogs] = await Promise.all([
    getPlatformDashboardData({
      devicePage,
      schoolsPage,
      subscriptionsPage,
      deviceFilters: {
        q: deviceQ,
        requesterRole: deviceRequesterRole,
        createdFrom: deviceCreatedRange.from,
        createdTo: deviceCreatedRange.to,
        expiresFrom: deviceExpiresRange.from,
        expiresTo: deviceExpiresRange.to,
      },
      schoolsFilters: {
        q: schoolsQ,
        plan: schoolsPlan,
        isActive: schoolsIsActive,
        createdFrom: schoolsCreatedRange.from,
        createdTo: schoolsCreatedRange.to,
      },
      subscriptionsFilters: {
        q: subscriptionsQ,
        plan: subscriptionsPlan,
        status: subscriptionsStatus,
        isActive: subscriptionsIsActive,
        periodFrom: subscriptionsPeriodRange.from,
        periodTo: subscriptionsPeriodRange.to,
      },
    }),
    getActivityLogs(),
  ]);

  const now = new Date();
  const chartData = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      month: date.toLocaleString("en-US", { month: "short" }),
      revenue: Math.max(0, data.monthlyRevenue - (5 - index) * 20),
      schools: Math.max(1, data.totalSchools - (5 - index)),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Platform Dashboard
        </p>
        <h2 className="text-2xl font-semibold">Super Admin Overview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Schools" value={String(data.totalSchools)} />
        <StatCard
          title="Active Subscriptions"
          value={String(data.activeSubscriptions)}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${Number(data.monthlyRevenue).toFixed(2)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <PlatformRevenueChart data={chartData} />
        <div className="rounded-lg border bg-background p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Highlights
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>Total schools onboarded: {data.totalSchools}</li>
            <li>Active paid subscriptions: {data.activeSubscriptions}</li>
            <li>
              Latest growth index:{" "}
              {chartData.at(-1)?.schools ?? data.totalSchools}
            </li>
          </ul>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Device Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="mb-4 grid gap-3 md:grid-cols-4" method="get">
            <input type="hidden" name="schoolsPage" value={params.schoolsPage ?? ""} />
            <input type="hidden" name="subscriptionsPage" value={params.subscriptionsPage ?? ""} />
            <input type="hidden" name="schools_q" value={params.schools_q ?? ""} />
            <input type="hidden" name="schools_plan" value={params.schools_plan ?? ""} />
            <input type="hidden" name="schools_isActive" value={params.schools_isActive ?? ""} />
            <input type="hidden" name="schools_createdFrom" value={params.schools_createdFrom ?? ""} />
            <input type="hidden" name="schools_createdTo" value={params.schools_createdTo ?? ""} />
            <input type="hidden" name="subscriptions_q" value={params.subscriptions_q ?? ""} />
            <input type="hidden" name="subscriptions_plan" value={params.subscriptions_plan ?? ""} />
            <input type="hidden" name="subscriptions_status" value={params.subscriptions_status ?? ""} />
            <input type="hidden" name="subscriptions_isActive" value={params.subscriptions_isActive ?? ""} />
            <input type="hidden" name="subscriptions_periodFrom" value={params.subscriptions_periodFrom ?? ""} />
            <input type="hidden" name="subscriptions_periodTo" value={params.subscriptions_periodTo ?? ""} />

            <div className="grid gap-1 md:col-span-2">
              <Label htmlFor="device_q">Search</Label>
              <Input
                id="device_q"
                name="device_q"
                defaultValue={deviceQ}
                placeholder="Requester, email, school, IP, user agent"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="device_requesterRole">Role</Label>
              <select
                id="device_requesterRole"
                name="device_requesterRole"
                defaultValue={deviceRequesterRole ?? ""}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All</option>
                <option value="SCHOOL_ADMIN">School Admin</option>
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm">Apply</Button>
              <Button asChild type="button" size="sm" variant="outline">
                <Link href={hrefWithQuery("/platform/dashboard", deviceResetParams)}>Reset</Link>
              </Button>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="device_createdFrom">Requested From</Label>
              <Input id="device_createdFrom" name="device_createdFrom" type="date" defaultValue={parseTextParam(params.device_createdFrom)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="device_createdTo">Requested To</Label>
              <Input id="device_createdTo" name="device_createdTo" type="date" defaultValue={parseTextParam(params.device_createdTo)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="device_expiresFrom">Expires From</Label>
              <Input id="device_expiresFrom" name="device_expiresFrom" type="date" defaultValue={parseTextParam(params.device_expiresFrom)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="device_expiresTo">Expires To</Label>
              <Input id="device_expiresTo" name="device_expiresTo" type="date" defaultValue={parseTextParam(params.device_expiresTo)} />
            </div>
          </form>

          <DeviceApprovalTable
            initialRequests={data.deviceApprovalRequests.items}
            showSchool
          />
          <TablePagination
            pagination={data.deviceApprovalRequests}
            pathname="/platform/dashboard"
              searchParams={{
                devicePage: params.devicePage,
                schoolsPage: params.schoolsPage,
                subscriptionsPage: params.subscriptionsPage,
                device_q: params.device_q,
                device_requesterRole: params.device_requesterRole,
                device_createdFrom: params.device_createdFrom,
                device_createdTo: params.device_createdTo,
                device_expiresFrom: params.device_expiresFrom,
                device_expiresTo: params.device_expiresTo,
                schools_q: params.schools_q,
                schools_plan: params.schools_plan,
                schools_isActive: params.schools_isActive,
                schools_createdFrom: params.schools_createdFrom,
                schools_createdTo: params.schools_createdTo,
                subscriptions_q: params.subscriptions_q,
                subscriptions_plan: params.subscriptions_plan,
                subscriptions_status: params.subscriptions_status,
                subscriptions_isActive: params.subscriptions_isActive,
                subscriptions_periodFrom: params.subscriptions_periodFrom,
                subscriptions_periodTo: params.subscriptions_periodTo,
              }}
              pageParamName="devicePage"
            />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="mb-4 grid gap-3 md:grid-cols-4" method="get">
              <input type="hidden" name="devicePage" value={params.devicePage ?? ""} />
              <input type="hidden" name="subscriptionsPage" value={params.subscriptionsPage ?? ""} />
              <input type="hidden" name="device_q" value={params.device_q ?? ""} />
              <input type="hidden" name="device_requesterRole" value={params.device_requesterRole ?? ""} />
              <input type="hidden" name="device_createdFrom" value={params.device_createdFrom ?? ""} />
              <input type="hidden" name="device_createdTo" value={params.device_createdTo ?? ""} />
              <input type="hidden" name="device_expiresFrom" value={params.device_expiresFrom ?? ""} />
              <input type="hidden" name="device_expiresTo" value={params.device_expiresTo ?? ""} />
              <input type="hidden" name="subscriptions_q" value={params.subscriptions_q ?? ""} />
              <input type="hidden" name="subscriptions_plan" value={params.subscriptions_plan ?? ""} />
              <input type="hidden" name="subscriptions_status" value={params.subscriptions_status ?? ""} />
              <input type="hidden" name="subscriptions_isActive" value={params.subscriptions_isActive ?? ""} />
              <input type="hidden" name="subscriptions_periodFrom" value={params.subscriptions_periodFrom ?? ""} />
              <input type="hidden" name="subscriptions_periodTo" value={params.subscriptions_periodTo ?? ""} />

              <div className="grid gap-1 md:col-span-2">
                <Label htmlFor="schools_q">Search</Label>
                <Input id="schools_q" name="schools_q" defaultValue={schoolsQ} placeholder="Name or slug" />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="schools_plan">Plan</Label>
                <select id="schools_plan" name="schools_plan" defaultValue={schoolsPlan ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
                  <option value="">All</option>
                  <option value="FREE">Free</option>
                  <option value="BASIC">Basic</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="schools_isActive">Status</Label>
                <select id="schools_isActive" name="schools_isActive" defaultValue={schoolsIsActiveRaw ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="schools_createdFrom">Created From</Label>
                <Input id="schools_createdFrom" name="schools_createdFrom" type="date" defaultValue={parseTextParam(params.schools_createdFrom)} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="schools_createdTo">Created To</Label>
                <Input id="schools_createdTo" name="schools_createdTo" type="date" defaultValue={parseTextParam(params.schools_createdTo)} />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" size="sm">Apply</Button>
                <Button asChild type="button" size="sm" variant="outline">
                  <Link href={hrefWithQuery("/platform/dashboard", schoolsResetParams)}>Reset</Link>
                </Button>
              </div>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tenants.items.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.plan}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.isActive ? "default" : "outline"}>
                        {tenant.isActive ? "ACTIVE" : "DISABLED"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                      }).format(tenant.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button size="sm" variant="ghost">
                          Disable
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
                      No schools yet.
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
                schoolsPage: params.schoolsPage,
                subscriptionsPage: params.subscriptionsPage,
                device_q: params.device_q,
                device_requesterRole: params.device_requesterRole,
                device_createdFrom: params.device_createdFrom,
                device_createdTo: params.device_createdTo,
                device_expiresFrom: params.device_expiresFrom,
                device_expiresTo: params.device_expiresTo,
                schools_q: params.schools_q,
                schools_plan: params.schools_plan,
                schools_isActive: params.schools_isActive,
                schools_createdFrom: params.schools_createdFrom,
                schools_createdTo: params.schools_createdTo,
                subscriptions_q: params.subscriptions_q,
                subscriptions_plan: params.subscriptions_plan,
                subscriptions_status: params.subscriptions_status,
                subscriptions_isActive: params.subscriptions_isActive,
                subscriptions_periodFrom: params.subscriptions_periodFrom,
                subscriptions_periodTo: params.subscriptions_periodTo,
              }}
              pageParamName="schoolsPage"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="mb-4 grid gap-3 md:grid-cols-4" method="get">
              <input type="hidden" name="devicePage" value={params.devicePage ?? ""} />
              <input type="hidden" name="schoolsPage" value={params.schoolsPage ?? ""} />
              <input type="hidden" name="device_q" value={params.device_q ?? ""} />
              <input type="hidden" name="device_requesterRole" value={params.device_requesterRole ?? ""} />
              <input type="hidden" name="device_createdFrom" value={params.device_createdFrom ?? ""} />
              <input type="hidden" name="device_createdTo" value={params.device_createdTo ?? ""} />
              <input type="hidden" name="device_expiresFrom" value={params.device_expiresFrom ?? ""} />
              <input type="hidden" name="device_expiresTo" value={params.device_expiresTo ?? ""} />
              <input type="hidden" name="schools_q" value={params.schools_q ?? ""} />
              <input type="hidden" name="schools_plan" value={params.schools_plan ?? ""} />
              <input type="hidden" name="schools_isActive" value={params.schools_isActive ?? ""} />
              <input type="hidden" name="schools_createdFrom" value={params.schools_createdFrom ?? ""} />
              <input type="hidden" name="schools_createdTo" value={params.schools_createdTo ?? ""} />

              <div className="grid gap-1 md:col-span-2">
                <Label htmlFor="subscriptions_q">Search</Label>
                <Input id="subscriptions_q" name="subscriptions_q" defaultValue={subscriptionsQ} placeholder="Tenant name" />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="subscriptions_plan">Plan</Label>
                <select id="subscriptions_plan" name="subscriptions_plan" defaultValue={subscriptionsPlan ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
                  <option value="">All</option>
                  <option value="FREE">Free</option>
                  <option value="BASIC">Basic</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="subscriptions_status">Status</Label>
                <select id="subscriptions_status" name="subscriptions_status" defaultValue={subscriptionsStatus ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
                  <option value="">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAST_DUE">Past Due</option>
                  <option value="CANCELED">Canceled</option>
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="subscriptions_isActive">Active Flag</Label>
                <select id="subscriptions_isActive" name="subscriptions_isActive" defaultValue={subscriptionsIsActiveRaw ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="subscriptions_periodFrom">Period End From</Label>
                <Input id="subscriptions_periodFrom" name="subscriptions_periodFrom" type="date" defaultValue={parseTextParam(params.subscriptions_periodFrom)} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="subscriptions_periodTo">Period End To</Label>
                <Input id="subscriptions_periodTo" name="subscriptions_periodTo" type="date" defaultValue={parseTextParam(params.subscriptions_periodTo)} />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" size="sm">Apply</Button>
                <Button asChild type="button" size="sm" variant="outline">
                  <Link href={hrefWithQuery("/platform/dashboard", subscriptionsResetParams)}>Reset</Link>
                </Button>
              </div>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Billing</TableHead>
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
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat("en-US", {
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
                      No subscriptions yet.
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
                subscriptionsPage: params.subscriptionsPage,
                device_q: params.device_q,
                device_requesterRole: params.device_requesterRole,
                device_createdFrom: params.device_createdFrom,
                device_createdTo: params.device_createdTo,
                device_expiresFrom: params.device_expiresFrom,
                device_expiresTo: params.device_expiresTo,
                schools_q: params.schools_q,
                schools_plan: params.schools_plan,
                schools_isActive: params.schools_isActive,
                schools_createdFrom: params.schools_createdFrom,
                schools_createdTo: params.schools_createdTo,
                subscriptions_q: params.subscriptions_q,
                subscriptions_plan: params.subscriptions_plan,
                subscriptions_status: params.subscriptions_status,
                subscriptions_isActive: params.subscriptions_isActive,
                subscriptions_periodFrom: params.subscriptions_periodFrom,
                subscriptions_periodTo: params.subscriptions_periodTo,
              }}
              pageParamName="subscriptionsPage"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline items={activityLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
