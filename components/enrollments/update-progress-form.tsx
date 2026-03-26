"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateProgress,
  type EnrollmentActionState,
} from "@/app/(school)/enrollments/actions";
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
  const router = useRouter();
  const [state, formAction] = useActionState(updateProgress, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Progress updated.");
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to update progress.");
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
        <SubmitButton label="Update" loadingLabel="Updating..." />
      </div>
      <Input
        name="remark"
        defaultValue={currentRemark ?? ""}
        placeholder="Remark (optional)"
        className="h-8"
      />
    </form>
  );
}
