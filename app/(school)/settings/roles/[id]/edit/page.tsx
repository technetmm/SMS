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

  const role = await prisma.role.findFirst({
    where: { id, schoolId },
    select: { id: true, name: true },
  });

  if (!role) {
    redirect("/settings/roles");
  }

  return (
    <RoleEditForms
      role={role}
      showCreatedToast={query.created === "1"}
    />
  );
}
