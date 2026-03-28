import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteRole } from "@/app/(school)/settings/roles/actions";

export default async function RolesPage() {
  const session = await requireSchoolAdmin();
  const schoolId = session.user.schoolId;
  if (!schoolId) return null;

  const roles = await prisma.role.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      isSystem: true,
      _count: { select: { users: true } },
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Roles</h1>
        <Button asChild>
          <Link href="/settings/roles/create">Create Role</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{role.name}</p>
                <p className="text-xs text-muted-foreground">
                  {role._count.users} users
                  {role.isSystem ? " • System role" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/settings/roles/${role.id}/edit`}>Edit</Link>
                </Button>
                {!role.isSystem ? (
                  <form action={deleteRole}>
                    <input type="hidden" name="roleId" value={role.id} />
                    <Button type="submit" variant="destructive">
                      Delete
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
