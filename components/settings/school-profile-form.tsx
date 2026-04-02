"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateSchoolProfileAction, type ActionState } from "@/app/(school)/school/settings/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: ActionState = { status: "idle" };

type SchoolProfileFormProps = {
  tenant: {
    name: string;
    slug: string;
    isActive: boolean;
    billingDayOfMonth: number;
  };
  canEdit: boolean;
};

export function SchoolProfileForm({ tenant, canEdit }: SchoolProfileFormProps) {
  const [state, formAction] = useActionState(updateSchoolProfileAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "School profile updated.");
    } else if (state.status === "error") {
      toast.error(state.message ?? "Unable to update school profile.");
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Profile</CardTitle>
        <CardDescription>
          {canEdit
            ? "Update your school name and slug."
            : "Only the school owner admin can update school info."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={canEdit ? formAction : undefined} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="school-name">School name</Label>
            <Input
              id="school-name"
              name="name"
              defaultValue={tenant.name}
              required
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="school-slug">School slug</Label>
            <Input
              id="school-slug"
              name="slug"
              defaultValue={tenant.slug}
              required
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="school-status">Status</Label>
            <Input
              id="school-status"
              value={tenant.isActive ? "Active" : "Disabled"}
              readOnly
              className="bg-muted/40"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="billing-day">Monthly billing day (1-28)</Label>
            <Input
              id="billing-day"
              name="billingDayOfMonth"
              type="number"
              min={1}
              max={28}
              defaultValue={tenant.billingDayOfMonth}
              required
              disabled={!canEdit}
            />
          </div>

          {canEdit ? (
            <SubmitButton label="Save School Info" loadingLabel="Saving..." />
          ) : (
            <p className="text-sm text-muted-foreground">
              This account can view school info but cannot edit it.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
