"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Currency } from "@/app/generated/prisma/enums";
import { updateSchoolProfileAction, type ActionState } from "@/app/(school)/school/settings/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: ActionState = { status: "idle" };

type SchoolProfileFormProps = {
  tenant: {
    name: string;
    slug: string;
    currency: Currency;
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
            ? "Update your school name, slug, and default currency."
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
            <Label htmlFor="school-currency">Currency</Label>
            <Select
              name="currency"
              defaultValue={tenant.currency}
              disabled={!canEdit}
            >
              <SelectTrigger id="school-currency" className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={Currency.USD}>USD</SelectItem>
                <SelectItem value={Currency.MMK}>MMK</SelectItem>
                <SelectItem value={Currency.THB}>THB</SelectItem>
              </SelectContent>
            </Select>
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
