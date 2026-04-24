"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  updateProgress,
  type EnrollmentActionState,
} from "@/app/(school)/school/enrollments/actions";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";

const initialState: EnrollmentActionState = { status: "idle" };

export function UpdateProgressForm({
  enrollmentId,
  currentProgress,
  currentRemark,
}: {
  enrollmentId: string;
  currentProgress?: number;
  currentRemark?: string | null;
}) {
  const t = useTranslations("SchoolEntities.enrollments.progress");
  const router = useRouter();
  const [state, formAction] = useActionState(updateProgress, initialState);

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
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <div className="flex items-center gap-2">
        <Input
          name="progress"
          type="number"
          min={0}
          max={100}
          step={1}
          defaultValue={currentProgress ?? 0}
          className="h-8 w-20"
        />
        <span className="text-xs text-muted-foreground">%</span>
        <SubmitButton label={t("update")} loadingLabel={t("updating")} />
      </div>
      <Input
        name="remark"
        defaultValue={currentRemark ?? ""}
        placeholder={t("remarkPlaceholder")}
        className="h-8"
      />
    </form>
  );
}
