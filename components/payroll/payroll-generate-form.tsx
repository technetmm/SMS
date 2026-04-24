"use client";

import { useActionState, useEffect } from "react";
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
  action: (prevState: PayrollActionState, formData: FormData) => Promise<PayrollActionState>;
}) {
  const t = useTranslations("SchoolEntities.payroll.generate");
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? t("messages.generated"));
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? t("messages.generateFailed"));
    }
  }, [router, state, t]);

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
            <p className="text-xs text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton label={t("generate")} loadingLabel={t("generating")} />
      </div>
    </form>
  );
}
