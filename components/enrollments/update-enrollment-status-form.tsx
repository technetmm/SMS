"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const router = useRouter();
  const [state, formAction] = useActionState(updateEnrollment, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Enrollment updated.");
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to update enrollment.");
    }
  }, [router, state]);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Select name="status" defaultValue={currentStatus}>
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="DROPPED">Dropped</SelectItem>
        </SelectContent>
      </Select>
      <SubmitButton label="Save" loadingLabel="Saving..." />
    </form>
  );
}
