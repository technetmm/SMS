import {
  getPaginatedSubscriptions,
  getTenants,
} from "@/app/(platform)/actions";
import { SubscriptionForm } from "@/components/platform/subscription-form";
import { SubscriptionRowEditor } from "@/components/platform/subscription-row-editor";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parsePageParam } from "@/lib/pagination";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const [subscriptions, tenants] = await Promise.all([
    getPaginatedSubscriptions({ page }),
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
          />
        </CardContent>
      </Card>
    </div>
  );
}
