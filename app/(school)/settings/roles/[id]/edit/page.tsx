import { redirect } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma/client";
import { RoleEditForms } from "@/components/settings/role-edit-forms";

export default async function EditRolePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ created?: string }>;
}) {
  const session = await requireSchoolAdmin();
  const schoolId = session.user.schoolId;
  const { id } = await params;
  const query = (await searchParams) ?? {};

  if (!schoolId) return null;

  const [role, permissions, rolePermissions] = await Promise.all([
    prisma.role.findFirst({
      where: { id, schoolId },
      select: { id: true, name: true },
    }),
    prisma.permission.findMany({
      select: { key: true, category: true },
      orderBy: [{ category: "asc" }, { key: "asc" }],
    }),
    prisma.rolePermission.findMany({
      where: { roleId: id },
      select: { permission: { select: { key: true } } },
    }),
  ]);

  if (!role) {
    redirect("/settings/roles");
  }

  const enabledSet = new Set(rolePermissions.map((item) => item.permission.key));

  return (
    <RoleEditForms
      role={role}
      permissions={permissions}
      enabledPermissionKeys={enabledSet}
      showCreatedToast={query.created === "1"}
    />
  );
}
