"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { DayOfWeek } from "@/app/generated/prisma/enums";
import type { TimetableActionState } from "@/app/(school)/timetable/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const initialState: TimetableActionState = { status: "idle" };

type Option = { id: string; name: string };

type TimetableFormProps = {
  mode: "create" | "edit";
  action: (
    prevState: TimetableActionState,
    formData: FormData,
  ) => Promise<TimetableActionState>;
  teachers: Option[];
  sections: Option[];
  initialData?: {
    id: string;
    teacherId: string;
    sectionId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    room: string | null;
  };
};

const days: Array<{ value: DayOfWeek; label: string }> = [
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
  { value: "SUN", label: "Sun" },
];

export function TimetableForm({
  mode,
  action,
  teachers,
  sections,
  initialData,
}: TimetableFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialState);
  const teacherAnchor = useComboboxAnchor();
  const sectionAnchor = useComboboxAnchor();

  const initialTeacher = useMemo(
    () => teachers.find((item) => item.id === initialData?.teacherId) ?? null,
    [teachers, initialData?.teacherId],
  );
  const initialSection = useMemo(
    () => sections.find((item) => item.id === initialData?.sectionId) ?? null,
    [sections, initialData?.sectionId],
  );

  const [selectedTeacher, setSelectedTeacher] = useState<Option | null>(
    initialTeacher,
  );
  const [selectedSection, setSelectedSection] = useState<Option | null>(
    initialSection,
  );

  // `initialData` is stable for the lifetime of the page render (server component),
  // so we don't need to sync state from props via an effect.

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Saved");
      router.push("/timetable");
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to save timetable slot");
    }
  }, [router, state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!selectedTeacher) {
      event.preventDefault();
      toast.error("Please select a teacher.");
      return;
    }
    if (!selectedSection) {
      event.preventDefault();
      toast.error("Please select a section.");
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      {mode === "edit" && initialData ? (
        <input type="hidden" name="id" value={initialData.id} />
      ) : null}
      <input type="hidden" name="teacherId" value={selectedTeacher?.id ?? ""} />
      <input type="hidden" name="sectionId" value={selectedSection?.id ?? ""} />

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create"
              ? "Create Timetable Slot"
              : "Edit Timetable Slot"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Teacher</Label>
            <Combobox
              items={teachers}
              value={selectedTeacher}
              onValueChange={(value: Option | null) =>
                setSelectedTeacher(value)
              }
              // itemToStringLabel={(item) => item?.name ?? ""}
            >
              <ComboboxChips ref={teacherAnchor} className="w-full">
                <ComboboxValue>
                  {(value) => (
                    <>
                      {value ? <ComboboxChip>{value.name}</ComboboxChip> : null}
                      <ComboboxChipsInput placeholder="Search teacher..." />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={teacherAnchor}>
                <ComboboxInput placeholder="Search teacher..." />
                <ComboboxEmpty>No teachers found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: Option) => (
                    <ComboboxItem key={item.id} value={item}>
                      {item?.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="grid gap-2">
            <Label>Section</Label>
            <Combobox
              items={sections}
              value={selectedSection}
              onValueChange={(value: Option | null) =>
                setSelectedSection(value)
              }
              itemToStringLabel={(item) => item?.name ?? ""}
            >
              <ComboboxChips ref={sectionAnchor} className="w-full">
                <ComboboxValue>
                  {(value) => (
                    <>
                      {value ? <ComboboxChip>{value.name}</ComboboxChip> : null}
                      <ComboboxChipsInput placeholder="Search section..." />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={sectionAnchor}>
                <ComboboxInput placeholder="Search section..." />
                <ComboboxEmpty>No sections found.</ComboboxEmpty>
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
            <Label htmlFor="dayOfWeek">Day</Label>
            <Select
              name="dayOfWeek"
              defaultValue={initialData?.dayOfWeek ?? "MON"}
            >
              <SelectTrigger id="dayOfWeek" className="w-full">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent position="popper">
                {days.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="room">Room (Optional)</Label>
            <Input
              id="room"
              name="room"
              defaultValue={initialData?.room ?? ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              defaultValue={initialData?.startTime ?? "09:00"}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              name="endTime"
              type="time"
              defaultValue={initialData?.endTime ?? "10:00"}
              required
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="outline">
          <Link href="/timetable">Cancel</Link>
        </Button>
        <SubmitButton
          label={mode === "create" ? "Create Slot" : "Save Changes"}
          loadingLabel={mode === "create" ? "Creating..." : "Saving..."}
        />
      </div>
    </form>
  );
}
