"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  updateEnrollment,
  type EnrollmentActionState,
} from "@/app/(school)/school/enrollments/actions";
import { SubmitButton } from "@/components/shared/submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: EnrollmentActionState = { status: "idle" };

export function UpdateEnrollmentStatusForm({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: "ACTIVE" | "COMPLETED" | "DROPPED";
}) {
  const t = useTranslations("SchoolEntities.enrollments.status");
  const router = useRouter();
  const [state, formAction] = useActionState(updateEnrollment, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? t("messages.updated"));
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? t("messages.updateFailed"));
    }
  }, [router, state]);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Select name="status" defaultValue={currentStatus}>
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue placeholder={t("status")} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="ACTIVE">{t("options.active")}</SelectItem>
          <SelectItem value="COMPLETED">{t("options.completed")}</SelectItem>
          <SelectItem value="DROPPED">{t("options.dropped")}</SelectItem>
        </SelectContent>
      </Select>
      <SubmitButton label={t("save")} loadingLabel={t("saving")} />
    </form>
  );
}
