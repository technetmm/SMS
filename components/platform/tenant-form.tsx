"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import {
  createTenant,
  type PlatformActionState,
  updateTenant,
} from "@/app/(platform)/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: PlatformActionState = { status: "idle" };

export function TenantForm({
  mode = "create",
  defaultValues,
}: {
  mode?: "create" | "edit";
  defaultValues?: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
}) {
  const action = mode === "edit" ? updateTenant : createTenant;
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Tenant created");
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to create tenant");
    }
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="name">Tenant name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Sunrise Academy"
          required
          defaultValue={defaultValues?.name}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          placeholder="sunrise-academy"
          required
          defaultValue={defaultValues?.slug}
        />
      </div>
      {mode === "edit" ? (
        <>
          <input type="hidden" name="id" value={defaultValues?.id ?? ""} />
          <input
            type="hidden"
            name="isActive"
            value={String(defaultValues?.isActive ?? true)}
          />
        </>
      ) : null}
      <div className="md:col-span-2">
        <SubmitButton
          label={mode === "edit" ? "Save Tenant" : "Create Tenant"}
          loadingLabel={mode === "edit" ? "Saving..." : "Creating..."}
        />
      </div>
    </form>
  );
}
