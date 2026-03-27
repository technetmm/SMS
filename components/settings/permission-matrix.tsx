"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  type ActionState,
  setRolePermission,
} from "@/app/(school)/settings/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { enumLabel, PERMISSION_LABELS } from "@/lib/enum-labels";

const initialState: ActionState = { status: "idle" };

export function PermissionMatrix({
  roles,
  permissions,
  enabledMap,
}: {
  roles: Array<{ id: string; name: string }>;
  permissions: string[];
  enabledMap: Record<string, boolean>;
}) {
  const [state, formAction] = useActionState(setRolePermission, initialState);

  useEffect(() => {
    if (state.status === "success")
      toast.success(state.message ?? "Permission updated");
    if (state.status === "error")
      toast.error(state.message ?? "Failed to update permission");
  }, [state]);

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead className="min-w-45">Role</TableHead>
            {permissions.map((permission) => (
              <TableHead key={permission}>
                {enumLabel(permission, PERMISSION_LABELS)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium">{role.name}</TableCell>
              {permissions.map((permission) => {
                const key = `${role.id}:${permission}`;
                const enabled = Boolean(enabledMap[key]);
                return (
                  <TableCell key={key}>
                    <form action={formAction}>
                      <input type="hidden" name="roleId" value={role.id} />
                      <input
                        type="hidden"
                        name="permission"
                        value={permission}
                      />
                      <input
                        type="hidden"
                        name="enabled"
                        value={String(!enabled)}
                      />
                      <button
                        type="submit"
                        aria-label={`Toggle ${permission} for ${role.name}`}
                        className="inline-flex items-center"
                      >
                        <input
                          type="checkbox"
                          checked={enabled}
                          readOnly
                          className="h-4 w-4 rounded border"
                        />
                      </button>
                    </form>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
