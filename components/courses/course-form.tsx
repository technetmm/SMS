"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CourseActionState } from "@/app/(school)/courses/actions";
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
  ComboboxInput,
} from "@/components/ui/combobox";
import { uniqueBy } from "@/lib/helper";

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
  const [state, formAction] = useActionState(action, initialState);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>(
    uniqueBy(initialData?.subjects ?? []),
  );
  const anchor = useComboboxAnchor();

  useEffect(() => {
    setSelectedSubjects(uniqueSubjects(initialData?.subjects ?? []));
  }, [initialData?.subjects]);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Saved");
      router.push("/courses");
      router.refresh();
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
        <CardContent className="grid gap-4">
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
                    <>
                      {values.map((value: Subject) => (
                        <ComboboxChip key={value.id}>{value.name}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput placeholder="Search subjects..." />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={anchor}>
                <ComboboxInput placeholder="Search subjects..." />
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: Subject) => (
                    <ComboboxItem key={item.id} value={item}>
                      {item?.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <p className="text-xs text-muted-foreground">
              You can select multiple subjects for one course.
            </p>
          </div>
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
