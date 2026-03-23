"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { TeacherAttendanceActionState } from "@/app/(school)/teacher-attendance/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { DatePickerField } from "@/components/shared/date-picker-field";
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

const initialState: TeacherAttendanceActionState = { status: "idle" };

type Option = { id: string; name: string };

type Props = {
  action: (
    prevState: TeacherAttendanceActionState,
    formData: FormData,
  ) => Promise<TeacherAttendanceActionState>;
  teachers: Option[];
  sections: Option[];
};

export function TeacherAttendanceForm({ action, teachers, sections }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialState);
  const teacherAnchor = useComboboxAnchor();
  const sectionAnchor = useComboboxAnchor();

  const [selectedTeacher, setSelectedTeacher] = useState<Option | null>(null);
  const [selectedSection, setSelectedSection] = useState<Option | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Saved");
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to save attendance");
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
      <input type="hidden" name="teacherId" value={selectedTeacher?.id ?? ""} />
      <input type="hidden" name="sectionId" value={selectedSection?.id ?? ""} />

      <Card>
        <CardHeader>
          <CardTitle>Mark Teacher Attendance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Teacher</Label>
            <Combobox
              items={teachers}
              value={selectedTeacher}
              onValueChange={(value: Option | null) => setSelectedTeacher(value)}
              itemToStringLabel={(item) => item?.name ?? ""}
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
                      {item.name}
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
              onValueChange={(value: Option | null) => setSelectedSection(value)}
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

          <DatePickerField name="date" label="Date" defaultValue={today} />

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue="PRESENT">
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="LEAVE">Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton label="Save Attendance" loadingLabel="Saving..." />
      </div>
    </form>
  );
}

