"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  updateTeacherProgress,
  type TeacherActionState,
} from "@/app/(teacher)/teacher/actions";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";

const initialState: TeacherActionState = { status: "idle" };

export function TeacherProgressForm({
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
  const [state, formAction] = useActionState(
    updateTeacherProgress,
    initialState,
  );
  const handledStateKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.status === "idle") return;

    const stateKey = `${state.status}:${state.message ?? ""}`;
    if (handledStateKeyRef.current === stateKey) return;
    handledStateKeyRef.current = stateKey;

    if (state.status === "success") {
      toast.success(state.message ?? t("messages.updated"));
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? t("messages.updateFailed"));
    }
  }, [router, state.message, state.status, t]);

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={() => {
        handledStateKeyRef.current = null;
      }}
    >
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
