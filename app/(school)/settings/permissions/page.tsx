import { Permission, UserRole } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionMatrix } from "@/components/settings/permission-matrix";
import { UserPermissionOverrides } from "@/components/settings/user-permission-overrides";

const ROLE_OPTIONS: Array<UserRole> = [
  UserRole.SCHOOL_ADMIN,
  UserRole.STAFF,
  UserRole.STUDENT,
];

const PERMISSION_OPTIONS: Array<Permission> = [
  Permission.MANAGE_STUDENTS,
  Permission.MANAGE_STAFF,
  Permission.MANAGE_CLASSES,
  Permission.VIEW_REPORTS,
];

export default async function PermissionsPage() {
  const session = await requireRole([UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN]);
  const tenantId = session.user.tenantId;

  const [rolePermissions, users] = await Promise.all([
    prisma.rolePermission.findMany({
      where: { role: { in: ROLE_OPTIONS } },
      select: { role: true, permission: true },
    }),
    prisma.user.findMany({
      where: { tenantId: tenantId ?? undefined, role: { in: ROLE_OPTIONS } },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const enabledMap = rolePermissions.reduce<Record<string, boolean>>((acc, item) => {
    acc[`${item.role}:${item.permission}`] = true;
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
            roles={ROLE_OPTIONS}
            permissions={PERMISSION_OPTIONS}
            enabledMap={enabledMap}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Permission Overrides</CardTitle>
        </CardHeader>
        <CardContent>
          <UserPermissionOverrides
            users={users.map((u) => ({
              id: u.id,
              name: u.name ?? "Unnamed",
              email: u.email,
            }))}
            permissions={PERMISSION_OPTIONS}
          />
        </CardContent>
      </Card>
    </div>
  );
}
