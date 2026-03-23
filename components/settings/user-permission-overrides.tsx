"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  setUserPermission,
  type ActionState,
} from "@/app/(school)/settings/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enumLabel, PERMISSION_LABELS } from "@/lib/enum-labels";

const initialState: ActionState = { status: "idle" };

export function UserPermissionOverrides({
  users,
  permissions,
}: {
  users: Array<{ id: string; name: string; email: string }>;
  permissions: string[];
}) {
  const [state, formAction] = useActionState(setUserPermission, initialState);

  useEffect(() => {
    if (state.status === "success")
      toast.success(state.message ?? "Override updated");
    if (state.status === "error")
      toast.error(state.message ?? "Failed to update override");
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4 lg:grid-cols-4">
      <div className="grid gap-2 md:col-span-2">
        <Label>User</Label>
        <Select name="userId">
          <SelectTrigger id="userId" className="w-full">
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Permission</Label>
        <Select name="permission">
          <SelectTrigger id="permission" className="w-full">
            <SelectValue placeholder="Select permission" />
          </SelectTrigger>
          <SelectContent position="popper">
            {permissions.map((permission) => (
              <SelectItem key={permission} value={permission}>
                {enumLabel(permission, PERMISSION_LABELS)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Action</Label>
        <Select name="enabled" defaultValue="true">
          <SelectTrigger id="enabled" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="true">Grant</SelectItem>
            <SelectItem value="false">Revoke</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-4">
        <Button type="submit">Save Override</Button>
      </div>
    </form>
  );
}
