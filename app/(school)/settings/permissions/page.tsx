import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/permissions";
import { UserRole } from "@/app/generated/prisma/enums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionMatrix } from "@/components/settings/permission-matrix";

export default async function PermissionsPage() {
  const session = await requireRole([UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN]);
  const schoolId = session.user.schoolId;

  if (!schoolId && session.user.role !== UserRole.SUPER_ADMIN) {
    return null;
  }

  const [roles, permissions, rolePermissions] = await Promise.all([
    prisma.role.findMany({
      where: schoolId ? { schoolId } : undefined,
      select: { id: true, name: true },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
    prisma.permission.findMany({
      select: { id: true, key: true, category: true },
      orderBy: [{ category: "asc" }, { key: "asc" }],
    }),
    prisma.rolePermission.findMany({
      where: {
        role: schoolId ? { schoolId } : undefined,
      },
      select: {
        roleId: true,
        permission: { select: { key: true } },
      },
    }),
  ]);

  const enabledMap = rolePermissions.reduce<Record<string, boolean>>((acc, item) => {
    acc[`${item.roleId}:${item.permission.key}`] = true;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionMatrix
            roles={roles}
            permissions={permissions.map((item) => item.key)}
            enabledMap={enabledMap}
          />
        </CardContent>
      </Card>
    </div>
  );
}
