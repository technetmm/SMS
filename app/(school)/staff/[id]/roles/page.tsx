import { requireSchoolAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  assignRoleToUser,
  removeRoleFromUser,
} from "@/app/(school)/settings/roles/actions";

export default async function StaffRoleAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSchoolAdmin();
  const schoolId = session.user.schoolId;
  const { id } = await params;
  if (!schoolId) return null;

  const [staff, roles] = await Promise.all([
    prisma.staff.findFirst({
      where: { id, schoolId },
      select: { id: true, name: true, userId: true },
    }),
    prisma.role.findMany({
      where: { schoolId },
      select: { id: true, name: true, isSystem: true },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
  ]);

  if (!staff) return null;

  const assignments = await prisma.userRoleAssignment.findMany({
    where: { userId: staff.userId },
    select: { roleId: true },
  });

  const assignedRoleIds = new Set(assignments.map((item) => item.roleId));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Roles: {staff.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {roles.map((role) => {
          const assigned = assignedRoleIds.has(role.id);
          return (
            <div
              key={role.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{role.name}</p>
                {role.isSystem ? (
                  <p className="text-xs text-muted-foreground">System role</p>
                ) : null}
              </div>
              {assigned ? (
                <form
                  action={async (formData) => {
                    "use server";
                    await removeRoleFromUser({ status: "idle" }, formData);
                  }}
                >
                  <input type="hidden" name="userId" value={staff.userId} />
                  <input type="hidden" name="roleId" value={role.id} />
                  <Button type="submit" variant="outline">
                    Remove
                  </Button>
                </form>
              ) : (
                <form
                  action={async (formData) => {
                    "use server";
                    await assignRoleToUser({ status: "idle" }, formData);
                  }}
                >
                  <input type="hidden" name="userId" value={staff.userId} />
                  <input type="hidden" name="roleId" value={role.id} />
                  <Button type="submit">Assign</Button>
                </form>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
