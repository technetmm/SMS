"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("SettingsSchoolProfileForm");
  const [state, formAction] = useActionState(updateSchoolProfileAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? t("messages.updated"));
    } else if (state.status === "error") {
      toast.error(state.message ?? t("messages.updateFailed"));
    }
  }, [state, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {canEdit
            ? t("descriptionEditable")
            : t("descriptionReadOnly")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={canEdit ? formAction : undefined} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="school-name">{t("fields.schoolName")}</Label>
            <Input
              id="school-name"
              name="name"
              defaultValue={tenant.name}
              required
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="school-slug">{t("fields.schoolSlug")}</Label>
            <Input
              id="school-slug"
              name="slug"
              defaultValue={tenant.slug}
              required
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="school-status">{t("fields.status")}</Label>
            <Input
              id="school-status"
              value={tenant.isActive ? t("status.active") : t("status.disabled")}
              readOnly
              className="bg-muted/40"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="school-currency">{t("fields.currency")}</Label>
            <Select
              name="currency"
              defaultValue={tenant.currency}
              disabled={!canEdit}
            >
              <SelectTrigger id="school-currency" className="w-full">
                <SelectValue placeholder={t("fields.selectCurrency")} />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={Currency.USD}>USD</SelectItem>
                <SelectItem value={Currency.MMK}>MMK</SelectItem>
                <SelectItem value={Currency.THB}>THB</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="billing-day">{t("fields.billingDay")}</Label>
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
            <SubmitButton label={t("buttons.save")} loadingLabel={t("buttons.saving")} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("viewOnly")}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
