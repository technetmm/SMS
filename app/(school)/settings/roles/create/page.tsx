import { redirect } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createRole } from "@/app/(school)/settings/roles/actions";

export default async function CreateRolePage() {
  await requireSchoolAdmin();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Role</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData) => {
            "use server";
            const result = await createRole({ status: "idle" }, formData);
            if (result.status === "success") {
              if (result.roleId) {
                redirect(`/settings/roles/${result.roleId}/edit?created=1`);
              }
              redirect("/settings/roles");
            }
          }}
          className="space-y-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Role Name</Label>
            <Input id="name" name="name" placeholder="e.g. Librarian" required />
          </div>
          <Button type="submit">Create Role</Button>
        </form>
      </CardContent>
    </Card>
  );
}
