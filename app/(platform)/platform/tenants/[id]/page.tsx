import { notFound } from "next/navigation";
import { getTenants } from "@/app/(platform)/actions";
import { TenantForm } from "@/components/platform/tenant-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenants = await getTenants();
  const tenant = tenants.find((item) => item.id === id);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantForm
            mode="edit"
            defaultValues={{
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
              isActive: tenant.isActive,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
