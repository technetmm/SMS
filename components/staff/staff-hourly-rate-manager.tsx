"use client";

import { useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { formatMoney } from "@/lib/formatter";
import { updateStaffHourlyRate } from "@/app/(school)/school/staff/actions";
import { useTranslations } from "next-intl";

interface StaffHourlyRate {
  id: string;
  name: string;
  email: string;
  currentHourlyRate: number;
  status: string;
}

interface StaffHourlyRateManagerProps {
  staff: StaffHourlyRate[];
  currency: string;
}

export function StaffHourlyRateManager({
  staff,
  currency,
}: StaffHourlyRateManagerProps) {
  const t = useTranslations("SchoolEntities.staff.hourlyRate");
  const [selectedStaff, setSelectedStaff] = useState<StaffHourlyRate | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleUpdateRate = (staffMember: StaffHourlyRate) => {
    setSelectedStaff(staffMember);
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {staff.map((staffMember) => (
            <div
              key={staffMember.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{staffMember.name}</h3>
                  <Badge
                    variant={
                      staffMember.status === "ACTIVE" ? "default" : "outline"
                    }
                  >
                    {staffMember.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {staffMember.email}
                </p>
                <p className="text-sm font-medium mt-1">
                  {t("currentRate")}:{" "}
                  {formatMoney(staffMember.currentHourlyRate, currency)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateRate(staffMember)}
              >
                {t("updateRate")}
              </Button>
            </div>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("updateDialogTitle")}</DialogTitle>
              <DialogDescription>
                {t("updateDialogDescription")}
              </DialogDescription>
            </DialogHeader>
            {selectedStaff && (
              <HourlyRateUpdateForm
                staff={selectedStaff}
                onSuccess={() => setIsDialogOpen(false)}
                currency={currency}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function HourlyRateUpdateForm({
  staff,
  onSuccess,
  currency,
}: {
  staff: StaffHourlyRate;
  onSuccess: () => void;
  currency: string;
}) {
  const t = useTranslations("SchoolEntities.staff.hourlyRate");
  const [state, formAction] = useActionState(updateStaffHourlyRate, {
    status: "idle",
  });

  if (state.status === "success") {
    toast.success(state.message || t("updateSuccess"));
    onSuccess();
  }

  if (state.status === "error") {
    toast.error(state.message || t("updateError"));
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="staffId" value={staff.id} />

      <div className="grid gap-2">
        <Label htmlFor="hourlyRate">{t("newHourlyRate")}</Label>
        <Input
          id="hourlyRate"
          name="hourlyRate"
          type="number"
          min="0"
          step="0.01"
          placeholder={formatMoney(0, currency)}
          defaultValue={staff.currentHourlyRate}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          {t("cancel")}
        </Button>
        <SubmitButton label={t("update")} loadingLabel={t("updating")} />
      </div>
    </form>
  );
}
