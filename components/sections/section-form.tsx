"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SectionActionState } from "@/app/(school)/sections/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { X } from "lucide-react";

const initialState: SectionActionState = { status: "idle" };

type Option = { id: string; name: string };

type SectionFormProps = {
  mode: "create" | "edit";
  action: (
    prevState: SectionActionState,
    formData: FormData,
  ) => Promise<SectionActionState>;
  classes: Option[];
  teachers: Option[];
  initialData?: {
    id: string;
    name: string;
    classId: string;
    teacherIds: string[];
    room: string | null;
    capacity: number;
  };
};

function uniqueById(items: Option[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

export function SectionForm({
  mode,
  action,
  classes,
  teachers,
  initialData,
}: SectionFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialState);
  const teacherAnchor = useComboboxAnchor();

  const initialClass = useMemo(
    () => classes.find((item) => item.id === initialData?.classId) ?? null,
    [classes, initialData?.classId],
  );
  const initialTeachers = useMemo(
    () =>
      (initialData?.teacherIds ?? [])
        .map((id) => teachers.find((item) => item.id === id))
        .filter((item): item is Option => Boolean(item)),
    [initialData?.teacherIds, teachers],
  );

  const [selectedClass, setSelectedClass] = useState<Option | null>(
    initialClass,
  );
  const [selectedTeachers, setSelectedTeachers] =
    useState<Option[]>(initialTeachers);

  // `initialData` is stable for the lifetime of the page render (server component),
  // so we don't need to sync state from props via an effect.

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Saved");
      router.push("/sections");
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to save section");
    }
  }, [router, state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!selectedClass) {
      event.preventDefault();
      toast.error("Please select a class.");
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      {mode === "edit" && initialData ? (
        <input type="hidden" name="id" value={initialData.id} />
      ) : null}
      <input type="hidden" name="classId" value={selectedClass?.id ?? ""} />
      {selectedTeachers.map((teacher) => (
        <input
          key={teacher.id}
          type="hidden"
          name="teacherIds"
          value={teacher.id}
        />
      ))}

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Create Section" : "Edit Section"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="name">Section Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData?.name ?? ""}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Class</Label>
            <Combobox
              items={classes}
              value={selectedClass}
              onValueChange={(value: Option | null) => setSelectedClass(value)}
              itemToStringLabel={(item) => item?.name ?? ""}
            >
              <ComboboxInput placeholder="Select class..." />
              <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: Option) => (
                    <ComboboxItem key={item.id} value={item}>
                      {item.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="grid gap-2">
            <Label>Teachers (Optional)</Label>
            <Combobox
              multiple
              autoHighlight
              items={teachers}
              value={selectedTeachers}
              onValueChange={(value: Option[]) =>
                setSelectedTeachers(uniqueById(value))
              }
              itemToStringLabel={(item) => item?.name ?? ""}
            >
              <ComboboxChips ref={teacherAnchor} className="w-full">
                <ComboboxValue>
                  {(values) => (
                    <>
                      {values.map((value: Option) => (
                        <ComboboxChip key={value.id}>{value.name}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput placeholder="Search teachers..." />
                    </>
                  )}
                </ComboboxValue>

                <button
                  type="button"
                  className="w-fit text-xs text-muted-foreground underline underline-offset-4"
                  onClick={() => setSelectedTeachers([])}
                >
                  <X size={16} />
                </button>
              </ComboboxChips>
              <ComboboxContent anchor={teacherAnchor}>
                <ComboboxInput placeholder="Search teachers..." />
                <ComboboxEmpty>No teachers found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: Option) => (
                    <ComboboxItem key={item.id} value={item}>
                      {item.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="room">Room</Label>
            <Input
              id="room"
              name="room"
              defaultValue={initialData?.room ?? ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="capacity">Max Students</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              defaultValue={initialData?.capacity?.toString() ?? "30"}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton
          label={mode === "create" ? "Create Section" : "Save Changes"}
          loadingLabel={mode === "create" ? "Creating..." : "Saving..."}
        />
      </div>
    </form>
  );
}
