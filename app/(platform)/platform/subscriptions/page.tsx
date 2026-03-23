import {
  getSubscriptions,
  getTenants,
} from "@/app/(platform)/actions";
import { SubscriptionForm } from "@/components/platform/subscription-form";
import { SubscriptionRowEditor } from "@/components/platform/subscription-row-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function SubscriptionsPage() {
  const [subscriptions, tenants] = await Promise.all([
    getSubscriptions(),
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
                {subscriptions.map((subscription) => (
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
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No subscriptions yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
