"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { formatMoney } from "@/lib/formatter";
import { adjustPayroll } from "@/app/(school)/school/payroll/actions";
import { useTranslations } from "next-intl";

interface PayrollRecord {
  id: string;
  staffName: string;
  month: Date;
  totalHours: number;
  totalAmount: number;
  originalAmount: number;
  currency: string;
}

interface PayrollAdjustmentFormProps {
  payroll: PayrollRecord;
  onSuccess: () => void;
}

export function PayrollAdjustmentForm({
  payroll,
  onSuccess,
}: PayrollAdjustmentFormProps) {
  const t = useTranslations("SchoolEntities.payroll.adjustment");
  const [state, formAction] = useActionState(adjustPayroll, { status: "idle" });
  const lastHandledKeyRef = useRef<string>("");

  useEffect(() => {
    if (state.status === "idle") return;

    const key = `${state.msgID}:${state.status}:${state.message ?? ""}`;
    if (lastHandledKeyRef.current === key) return;
    lastHandledKeyRef.current = key;

    if (state.status === "success") {
      toast.success(state.message || t("adjustmentSuccess"));
      onSuccess();
    }

    if (state.status === "error") {
      toast.error(state.message || t("adjustmentError"));
    }
  }, [state, t, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="payrollId" value={payroll.id} />

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{t("originalAmount")}</span>
          <span className="font-mono">
            {formatMoney(payroll.originalAmount, payroll.currency)}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{t("currentAmount")}</span>
          <span className="font-mono">
            {formatMoney(payroll.totalAmount, payroll.currency)}
          </span>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="adjustmentAmount">{t("adjustmentAmount")}</Label>
        <Input
          id="adjustmentAmount"
          name="adjustmentAmount"
          type="number"
          step="0.01"
          placeholder={formatMoney(0, payroll.currency)}
          required
        />
        <p className="text-xs text-muted-foreground">
          {t("adjustmentDescription")}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="adjustmentReason">{t("adjustmentReason")}</Label>
        <Input
          id="adjustmentReason"
          name="adjustmentReason"
          placeholder={t("adjustmentReasonPlaceholder")}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          {t("cancel")}
        </Button>
        <SubmitButton label={t("adjust")} loadingLabel={t("adjusting")} />
      </div>
    </form>
  );
}

interface PayrollAdjustmentButtonProps {
  payroll: PayrollRecord;
  onSuccess?: () => void;
}

export function PayrollAdjustmentButton({
  payroll,
  onSuccess,
}: PayrollAdjustmentButtonProps) {
  const t = useTranslations("SchoolEntities.payroll.adjustment");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSuccess = () => {
    setIsDialogOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {t("adjustPayroll")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("adjustDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("adjustDialogDescription")} {payroll.staffName} -{" "}
            {payroll.month.toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <PayrollAdjustmentForm payroll={payroll} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
