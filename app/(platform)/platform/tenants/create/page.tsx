import { TenantForm } from "@/components/platform/tenant-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateTenantPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantForm />
        </CardContent>
      </Card>
    </div>
  );
}
