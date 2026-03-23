"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ClassActionState } from "@/app/(school)/classes/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: ClassActionState = { status: "idle" };

type ClassFormProps = {
  mode: "create" | "edit";
  action: (
    prevState: ClassActionState,
    formData: FormData,
  ) => Promise<ClassActionState>;
  courses: Array<{ id: string; name: string }>;
  initialData?: {
    id: string;
    name: string;
    classType: "ONE_ON_ONE" | "PRIVATE" | "GROUP";
    programType: "REGULAR" | "INTENSIVE";
    courseId: string;
    fee: number;
    feeCurrency: "USD" | "MMK" | "THB";
  };
};

export function ClassForm({ mode, action, courses, initialData }: ClassFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Saved");
      router.push("/classes");
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to save class");
    }
  }, [router, state]);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && initialData ? (
        <input type="hidden" name="id" value={initialData.id} />
      ) : null}

      <Card>
        <CardHeader>
        <CardTitle>{mode === "create" ? "Create Class" : "Edit Class"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="name">Class Name</Label>
            <Input id="name" name="name" defaultValue={initialData?.name ?? ""} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fee">Class Fee</Label>
            <Input
              id="fee"
              name="fee"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initialData?.fee ?? 0}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feeCurrency">Currency</Label>
            <Select
              name="feeCurrency"
              defaultValue={initialData?.feeCurrency ?? "MMK"}
            >
              <SelectTrigger id="feeCurrency" className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="MMK">MMK</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="THB">THB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="courseId">Course</Label>
            <Select name="courseId" defaultValue={initialData?.courseId}>
              <SelectTrigger id="courseId" className="w-full">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent position="popper">
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="classType">Class Type</Label>
            <Select name="classType" defaultValue={initialData?.classType ?? "GROUP"}>
              <SelectTrigger id="classType" className="w-full">
                <SelectValue placeholder="Select class type" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="ONE_ON_ONE">One-on-One</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="GROUP">Group</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="programType">Program Type</Label>
            <Select name="programType" defaultValue={initialData?.programType ?? "REGULAR"}>
              <SelectTrigger id="programType" className="w-full">
                <SelectValue placeholder="Select program type" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="REGULAR">Regular</SelectItem>
                <SelectItem value="INTENSIVE">Intensive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton
          label={mode === "create" ? "Create Class" : "Save Changes"}
          loadingLabel={mode === "create" ? "Creating..." : "Saving..."}
        />
      </div>
    </form>
  );
}
