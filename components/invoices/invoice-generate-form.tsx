"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  generateMissingMonthlyInvoices,
  type BillingActionState,
} from "@/app/(school)/school/invoices/actions";
import { SubmitButton } from "@/components/shared/submit-button";
import { useTranslations } from "next-intl";

const initialState: BillingActionState = { status: "idle" };

export function InvoiceGenerateForm() {
  const t = useTranslations("SchoolEntities.invoices.generate");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    generateMissingMonthlyInvoices,
    initialState,
  );
  const lastHandledKeyRef = useRef<string>("");

  useEffect(() => {
    if (pending) {
      lastHandledKeyRef.current = "";
    }
  }, [pending]);

  useEffect(() => {
    if (state.status === "idle") return;

    const key = `${state.msgID}:${state.status}:${state.message ?? ""}`;
    if (lastHandledKeyRef.current === key) return;
    lastHandledKeyRef.current = key;

    if (state.status === "success") {
      toast.success(state.message ?? t("messages.generated"));
      router.refresh();
    }

    if (state.status === "error") {
      toast.error(state.message ?? t("messages.generateFailed"));
    }
  }, [router, state, t]);

  return (
    <form action={formAction}>
      <SubmitButton label={t("button")} loadingLabel={t("loading")} />
    </form>
  );
}
