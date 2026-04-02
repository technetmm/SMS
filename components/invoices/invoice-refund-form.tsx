"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addRefund, type BillingActionState } from "@/app/(school)/school/invoices/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: BillingActionState = { status: "idle" };

export function InvoiceRefundForm({
  payments,
}: {
  payments: Array<{ id: string; amount: string }>;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(addRefund, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Refund created.");
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to create refund.");
    }
  }, [router, state]);

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-4">
      <div className="grid gap-2">
        <Label htmlFor="paymentId">Payment</Label>
        <Select name="paymentId">
          <SelectTrigger id="paymentId" className="w-full">
            <SelectValue placeholder="Select payment" />
          </SelectTrigger>
          <SelectContent position="popper">
            {payments.map((payment) => (
              <SelectItem key={payment.id} value={payment.id}>
                {payment.id.slice(0, 8)} - ${Number(payment.amount).toFixed(2)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="refund-amount">Refund Amount</Label>
        <Input id="refund-amount" name="amount" type="number" min={0.01} step="0.01" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="refund-reason">Reason</Label>
        <Input id="refund-reason" name="reason" placeholder="Optional" />
      </div>
      <div className="flex items-end">
        <SubmitButton label="Create Refund" loadingLabel="Saving..." />
      </div>
    </form>
  );
}
