"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { PayrollActionState } from "@/app/(school)/school/payroll/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { useTranslations } from "next-intl";

const initialState: PayrollActionState = { status: "idle" };

export function PayrollGenerateForm({
  action,
}: {
  action: (
    prevState: PayrollActionState,
    formData: FormData,
  ) => Promise<PayrollActionState>;
}) {
  const t = useTranslations("SchoolEntities.payroll.generate");
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialState);
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (state.status === "success" && !hasShownToast.current) {
      toast.success(state.message ?? t("messages.generated"));
      hasShownToast.current = true;
      router.refresh();
    }
    if (state.status === "error" && !hasShownToast.current) {
      toast.error(state.message ?? t("messages.generateFailed"));
      hasShownToast.current = true;
    }

    // Reset toast flag when status returns to idle
    if (state.status === "idle") {
      hasShownToast.current = false;
    }
  }, [state.status, state.message, router, t]);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="month">{t("month")}</Label>
            <Input id="month" name="month" type="month" required />
            <p className="text-xs text-muted-foreground">{t("description")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton label={t("generate")} loadingLabel={t("generating")} />
      </div>
    </form>
  );
}
