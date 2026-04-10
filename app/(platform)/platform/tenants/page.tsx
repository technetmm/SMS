import { getPaginatedTenants } from "@/app/(platform)/actions";
import Link from "next/link";
import { Plan } from "@/app/generated/prisma/enums";
import { deleteTenant, toggleTenantStatus } from "@/app/(platform)/actions";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parsePageParam } from "@/lib/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseDateRangeParams, parseEnumParam, parseTextParam } from "@/lib/table-filters";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    plan?: string;
    isActive?: string;
    createdFrom?: string;
    createdTo?: string;
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
  const isActiveRaw = parseEnumParam(params.isActive, ["true", "false"] as const);
  const isActive = isActiveRaw == null ? undefined : isActiveRaw === "true";
  const createdRange = parseDateRangeParams({
    from: params.createdFrom,
    to: params.createdTo,
  });

  const tenants = await getPaginatedTenants({
    page,
    filters: {
      q,
      plan,
      isActive,
      createdFrom: createdRange.from,
      createdTo: createdRange.to,
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
          <div className="pt-2">
            <Button asChild size="sm">
              <Link href="/platform/tenants/create">Create Tenant</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="q">Search</Label>
              <Input id="q" name="q" defaultValue={q} placeholder="Name or slug" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan">Plan</Label>
              <select
                id="plan"
                name="plan"
                defaultValue={plan ?? ""}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All</option>
                <option value="FREE">Free</option>
                <option value="BASIC">Basic</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="isActive">Status</Label>
              <select
                id="isActive"
                name="isActive"
                defaultValue={isActiveRaw ?? ""}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdFrom">Created From</Label>
              <Input
                id="createdFrom"
                name="createdFrom"
                type="date"
                defaultValue={parseTextParam(params.createdFrom)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdTo">Created To</Label>
              <Input
                id="createdTo"
                name="createdTo"
                type="date"
                defaultValue={parseTextParam(params.createdTo)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="outline">
                <Link href="/platform/tenants">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.items.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.slug}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.isActive ? "default" : "outline"}>
                      {tenant.isActive ? "ACTIVE" : "DISABLED"}
                    </Badge>
                  </TableCell>
                  <TableCell>{tenant._count.users}</TableCell>
                  <TableCell>{tenant._count.students}</TableCell>
                  <TableCell>{tenant._count.staff}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild type="button" size="sm" variant="outline">
                        <Link href={`/platform/tenants/${tenant.id}`}>Edit</Link>
                      </Button>
                      <form action={toggleTenantStatus}>
                        <input type="hidden" name="id" value={tenant.id} />
                        <Button type="submit" size="sm" variant="outline">
                          {tenant.isActive ? "Disable" : "Enable"}
                        </Button>
                      </form>
                      <form action={deleteTenant}>
                        <input type="hidden" name="id" value={tenant.id} />
                        <Button type="submit" size="sm" variant="destructive">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {tenants.totalCount === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No tenants created yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <TablePagination
            pagination={tenants}
            pathname="/platform/tenants"
            searchParams={{
              q: params.q,
              plan: params.plan,
              isActive: params.isActive,
              createdFrom: params.createdFrom,
              createdTo: params.createdTo,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
