"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addPayment, type BillingActionState } from "@/app/(school)/school/invoices/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: BillingActionState = { status: "idle" };

export function InvoicePaymentForm({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(addPayment, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Payment added.");
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to add payment.");
    }
  }, [router, state]);

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div className="grid gap-2">
        <Label htmlFor={`payment-amount-${invoiceId}`}>Amount</Label>
        <Input id={`payment-amount-${invoiceId}`} name="amount" type="number" min={0.01} step="0.01" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`payment-method-${invoiceId}`}>Method</Label>
        <Input id={`payment-method-${invoiceId}`} name="method" placeholder="Cash / Bank / KBZPay" required />
      </div>
      <div className="flex items-end">
        <SubmitButton label="Add Payment" loadingLabel="Saving..." />
      </div>
    </form>
  );
}
