"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  assignPermissionsToRole,
  type RoleActionState,
  updateRole,
} from "@/app/(school)/settings/roles/actions";

const initialState: RoleActionState = { status: "idle" };

type RoleEditFormsProps = {
  role: { id: string; name: string };
  permissions: Array<{ key: string; category: string }>;
  enabledPermissionKeys: Set<string>;
  showCreatedToast?: boolean;
};

export function RoleEditForms({
  role,
  permissions,
  enabledPermissionKeys,
  showCreatedToast = false,
}: RoleEditFormsProps) {
  const [updateState, updateAction] = useActionState(updateRole, initialState);
  const [permissionState, permissionAction] = useActionState(
    assignPermissionsToRole,
    initialState,
  );
  const createdToastShown = useRef(false);

  useEffect(() => {
    if (showCreatedToast && !createdToastShown.current) {
      createdToastShown.current = true;
      toast.success("Role created. You can now assign permissions.");
    }
  }, [showCreatedToast]);

  useEffect(() => {
    if (updateState.status === "success") {
      toast.success(updateState.message ?? "Role updated.");
    } else if (updateState.status === "error") {
      toast.error(updateState.message ?? "Failed to update role.");
    }
  }, [updateState]);

  useEffect(() => {
    if (permissionState.status === "success") {
      toast.success(permissionState.message ?? "Permissions updated.");
    } else if (permissionState.status === "error") {
      toast.error(permissionState.message ?? "Failed to update permissions.");
    }
  }, [permissionState]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Role</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateAction} className="space-y-4">
            <input type="hidden" name="roleId" value={role.id} />
            <div className="grid gap-2">
              <Label htmlFor="name">Role Name</Label>
              <Input id="name" name="name" defaultValue={role.name} required />
            </div>
            <Button type="submit">Save Role</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={permissionAction} className="space-y-3">
            <input type="hidden" name="roleId" value={role.id} />
            <div className="grid gap-2 md:grid-cols-2">
              {permissions.map((permission) => (
                <label
                  key={permission.key}
                  className="flex items-center gap-2 rounded border p-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="permissionKeys"
                    value={permission.key}
                    defaultChecked={enabledPermissionKeys.has(permission.key)}
                  />
                  <span>{permission.key}</span>
                </label>
              ))}
            </div>
            <Button type="submit">Save Permissions</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
