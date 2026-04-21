"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  bulkPayAllInvoices,
  type BillingActionState,
} from "@/app/(school)/school/invoices/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const initialState: BillingActionState = { status: "idle" };

export function InvoicePaidAllForm({
  q,
  status,
  invoiceType,
  dueFrom,
  dueTo,
  finalMin,
  finalMax,
  disabled,
}: {
  q?: string;
  status?: string;
  invoiceType?: string;
  dueFrom?: string;
  dueTo?: string;
  finalMin?: string;
  finalMax?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("SchoolEntities.invoices.bulkPaidAll");
  const router = useRouter();
  const formId = "invoice-bulk-paid-all-form";
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    bulkPayAllInvoices,
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

    const key = `${state.status}:${state.message ?? ""}`;
    if (lastHandledKeyRef.current === key) return;
    lastHandledKeyRef.current = key;

    if (state.status === "success") {
      toast.success(state.message ?? t("messages.success"));
      setOpen(false);
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? t("messages.error"));
    }
  }, [router, state, t]);

  return (
    <>
      <form id={formId} action={formAction}>
        {q ? <input type="hidden" name="q" value={q} /> : null}
        {status ? <input type="hidden" name="status" value={status} /> : null}
        {invoiceType ? (
          <input type="hidden" name="invoiceType" value={invoiceType} />
        ) : null}
        {dueFrom ? <input type="hidden" name="dueFrom" value={dueFrom} /> : null}
        {dueTo ? <input type="hidden" name="dueTo" value={dueTo} /> : null}
        {finalMin ? (
          <input type="hidden" name="finalMin" value={finalMin} />
        ) : null}
        {finalMax ? (
          <input type="hidden" name="finalMax" value={finalMax} />
        ) : null}
      </form>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" disabled={disabled || pending}>
            {t("button")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {t("confirm.cancel")}
            </AlertDialogCancel>
            <Button type="submit" form={formId} disabled={pending}>
              {pending ? t("loading") : t("confirm.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
