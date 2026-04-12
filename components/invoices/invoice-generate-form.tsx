"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateMissingMonthlyInvoices, type BillingActionState } from "@/app/(school)/school/invoices/actions";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: BillingActionState = { status: "idle" };

export function InvoiceGenerateForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(
    generateMissingMonthlyInvoices,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Invoices generated.");
      router.refresh();
    }

    if (state.status === "error") {
      toast.error(state.message ?? "Unable to generate invoices.");
    }
  }, [router, state]);

  return (
    <form action={formAction}>
      <SubmitButton label="Generate Invoices" loadingLabel="Generating..." />
    </form>
  );
}
