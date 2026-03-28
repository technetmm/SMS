"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  type RoleActionState,
  updateRole,
} from "@/app/(school)/settings/roles/actions";

const initialState: RoleActionState = { status: "idle" };

type RoleEditFormsProps = {
  role: { id: string; name: string };
  showCreatedToast?: boolean;
};

export function RoleEditForms({
  role,
  showCreatedToast = false,
}: RoleEditFormsProps) {
  const [updateState, updateAction] = useActionState(updateRole, initialState);
  const createdToastShown = useRef(false);

  useEffect(() => {
    if (showCreatedToast && !createdToastShown.current) {
      createdToastShown.current = true;
      toast.success("Role created.");
    }
  }, [showCreatedToast]);

  useEffect(() => {
    if (updateState.status === "success") {
      toast.success(updateState.message ?? "Role updated.");
    } else if (updateState.status === "error") {
      toast.error(updateState.message ?? "Failed to update role.");
    }
  }, [updateState]);

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
    </div>
  );
}
