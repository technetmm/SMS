import { getTenants } from "@/app/(platform)/actions";
import Link from "next/link";
import { deleteTenant, toggleTenantStatus } from "@/app/(platform)/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function TenantsPage() {
  const tenants = await getTenants();

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
                <TableHead>Teachers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
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
                  <TableCell>{tenant._count.teachers}</TableCell>
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
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No tenants created yet.
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
