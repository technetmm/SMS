"use client";

import React, { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CourseActionState } from "@/app/(school)/school/courses/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxValue,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";

const initialState: CourseActionState = { status: "idle" };

type Subject = { id: string; name: string };

type CourseFormProps = {
  mode: "create" | "edit";
  action: (
    prevState: CourseActionState,
    formData: FormData,
  ) => Promise<CourseActionState>;
  subjects: Array<Subject>;
  initialData?: {
    id: string;
    name: string;
    subjects: Array<Subject>;
  };
};

function uniqueSubjects(items: Subject[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function CourseForm({
  mode,
  action,
  subjects,
  initialData,
}: CourseFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    CourseActionState,
    FormData
  >(action, initialState);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>(() =>
    uniqueSubjects(initialData?.subjects ?? []),
  );
  const anchor = useComboboxAnchor();
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
      router.push("/school/courses");
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to save course");
    }
  }, [router, state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (selectedSubjects.length === 0) {
      event.preventDefault();
      toast.error("Please select at least one subject.");
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      {selectedSubjects.map((subject) => (
        <input
          key={subject.id}
          type="hidden"
          name="subjectIds"
          value={subject.id}
        />
      ))}

      {mode === "edit" && initialData ? (
        <input type="hidden" name="id" value={initialData.id} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Create Course" : "Edit Course"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Course name</Label>
            <Input
              id="name"
              name="name"
              placeholder="English Foundation"
              defaultValue={initialData?.name ?? ""}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Subjects</Label>
            <Combobox
              multiple
              autoHighlight
              items={subjects}
              value={selectedSubjects}
              onValueChange={(value: Array<Subject>) =>
                setSelectedSubjects(uniqueSubjects(value))
              }
            >
              <ComboboxChips ref={anchor} className="w-full">
                <ComboboxValue>
                  {(values) => (
                    <React.Fragment>
                      {values.map((value: Subject) => (
                        <ComboboxChip key={value.id}>{value.name}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput />
                    </React.Fragment>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={anchor}>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: Subject) => (
                    <ComboboxItem key={item.id} value={item}>
                      {item.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <p className="text-xs text-muted-foreground">
            You can select multiple subjects for one course.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton
          label={mode === "create" ? "Create Course" : "Save Changes"}
          loadingLabel={mode === "create" ? "Creating..." : "Saving..."}
        />
      </div>
    </form>
  );
}
