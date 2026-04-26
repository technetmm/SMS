"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SubjectActionState } from "@/app/(school)/school/subjects/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";

const initialState: SubjectActionState = { status: "idle" };

type SubjectFormProps = {
  mode: "create" | "edit";
  action: (
    prevState: SubjectActionState,
    formData: FormData,
  ) => Promise<SubjectActionState>;
  initialData?: {
    id: string;
    name: string;
  };
};

export function SubjectForm({ mode, action, initialData }: SubjectFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    SubjectActionState,
    FormData
  >(action, initialState);
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
      toast.success(state.message ?? "Saved");
      router.push("/school/subjects");
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to save subject");
    }
  }, [router, state]);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && initialData ? (
        <input type="hidden" name="id" value={initialData.id} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Create Subject" : "Edit Subject"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Subject name</Label>
            <Input
              id="name"
              name="name"
              placeholder="English"
              defaultValue={initialData?.name ?? ""}
              required
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton
          label={mode === "create" ? "Create Subject" : "Save Changes"}
          loadingLabel={mode === "create" ? "Creating..." : "Saving..."}
        />
      </div>
    </form>
  );
}
