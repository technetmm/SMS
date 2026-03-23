import {
  getActivityLogs,
  getPlatformDashboardData,
} from "@/app/(platform)/actions";
import { ActivityTimeline } from "@/components/activity-timeline";
import { StatCard } from "@/components/shared/stat-card";
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

export default async function PlatformDashboardPage() {
  const [data, activityLogs] = await Promise.all([
    getPlatformDashboardData(),
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schools</CardTitle>
          </CardHeader>
          <CardContent>
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
                {data.tenants.map((tenant) => (
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
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
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
                {data.subscriptions.map((subscription) => (
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
              </TableBody>
            </Table>
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
