import {
  getPaginatedSubscriptions,
  getTenants,
} from "@/app/(platform)/actions";
import { Plan, SubscriptionStatus } from "@/app/generated/prisma/enums";
import { SubscriptionForm } from "@/components/platform/subscription-form";
import { SubscriptionRowEditor } from "@/components/platform/subscription-row-editor";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parsePageParam } from "@/lib/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { parseDateRangeParams, parseEnumParam, parseTextParam } from "@/lib/table-filters";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    plan?: string;
    status?: string;
    isActive?: string;
    periodFrom?: string;
    periodTo?: string;
  }>;
}) {
  const params = await searchParams;
  const { page: pageParam } = params;
  const page = parsePageParam(pageParam);
  const q = parseTextParam(params.q);
  const plan = parseEnumParam(params.plan, [
    Plan.FREE,
    Plan.BASIC,
    Plan.PREMIUM,
  ] as const);
  const status = parseEnumParam(params.status, [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAST_DUE,
    SubscriptionStatus.CANCELED,
  ] as const);
  const isActiveRaw = parseEnumParam(params.isActive, ["true", "false"] as const);
  const isActive = isActiveRaw == null ? undefined : isActiveRaw === "true";
  const periodRange = parseDateRangeParams({
    from: params.periodFrom,
    to: params.periodTo,
  });

  const [subscriptions, tenants] = await Promise.all([
    getPaginatedSubscriptions({
      page,
      filters: {
        q,
        plan,
        status,
        isActive,
        periodFrom: periodRange.from,
        periodTo: periodRange.to,
      },
    }),
    getTenants(),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionForm tenants={tenants.map((tenant) => ({ id: tenant.id, name: tenant.name }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input id="q" name="q" defaultValue={q} placeholder="Tenant name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan">Plan</Label>
              <select id="plan" name="plan" defaultValue={plan ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="">All</option>
                <option value="FREE">Free</option>
                <option value="BASIC">Basic</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" defaultValue={status ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="">All</option>
                <option value="ACTIVE">Active</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="isActive">Active Flag</Label>
              <select id="isActive" name="isActive" defaultValue={isActiveRaw ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="periodFrom">Period End From</Label>
              <Input id="periodFrom" name="periodFrom" type="date" defaultValue={parseTextParam(params.periodFrom)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="periodTo">Period End To</Label>
              <Input id="periodTo" name="periodTo" type="date" defaultValue={parseTextParam(params.periodTo)} />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/platform/subscriptions">Reset</Link>
              </Button>
            </div>
          </form>
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
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.items.map((subscription) => (
                  <TableRow key={subscription.id}>
                  <TableCell className="font-medium">
                    {subscription.tenant.name}
                  </TableCell>
                  <TableCell>{subscription.plan}</TableCell>
                  <TableCell>
                    <Badge variant={subscription.status === "ACTIVE" ? "default" : "outline"}>
                      {subscription.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={subscription.isActive ? "default" : "outline"}>
                      {subscription.isActive ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                    <TableCell>
                      {subscription.currentPeriodEnd
                      ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
                          subscription.currentPeriodEnd,
                        )
                      : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <SubscriptionRowEditor subscription={subscription} />
                    </TableCell>
                  </TableRow>
                ))}
              {subscriptions.totalCount === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No subscriptions yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <TablePagination
            pagination={subscriptions}
            pathname="/platform/subscriptions"
            searchParams={{
              q: params.q,
              plan: params.plan,
              status: params.status,
              isActive: params.isActive,
              periodFrom: params.periodFrom,
              periodTo: params.periodTo,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
