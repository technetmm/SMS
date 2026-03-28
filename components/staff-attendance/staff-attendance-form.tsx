"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { StaffAttendanceActionState } from "@/app/(school)/school/staff-attendance/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { AttendanceStatus } from "@/app/generated/prisma/enums";
import { Input } from "../ui/input";

const initialState: StaffAttendanceActionState = { status: "idle" };

type Option = { id: string; name: string };

type Props = {
  action: (
    prevState: StaffAttendanceActionState,
    formData: FormData,
  ) => Promise<StaffAttendanceActionState>;
  staff: Option[];
  sections: Option[];
};

export function StaffAttendanceForm({ action, staff, sections }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialState);
  const staffAnchor = useComboboxAnchor();
  const sectionAnchor = useComboboxAnchor();

  const [selectedStaff, setSelectedStaff] = useState<Option | null>(null);
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
    if (!selectedStaff) {
      event.preventDefault();
      toast.error("Please select a staff.");
      return;
    }
    if (!selectedSection) {
      event.preventDefault();
      toast.error("Please select a section.");
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="staffId" value={selectedStaff?.id ?? ""} />
      <input type="hidden" name="sectionId" value={selectedSection?.id ?? ""} />

      <Card>
        <CardHeader>
          <CardTitle>Mark Staff Attendance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Staff</Label>
            <Combobox
              items={staff}
              value={selectedStaff}
              onValueChange={(value: Option | null) => setSelectedStaff(value)}
              itemToStringLabel={(item) => item?.name ?? ""}
            >
              <ComboboxChips ref={staffAnchor} className="w-full">
                <ComboboxValue>
                  {(value) => (
                    <>
                      {value ? <ComboboxChip>{value.name}</ComboboxChip> : null}
                      <ComboboxChipsInput placeholder="Search staff..." />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={staffAnchor}>
                <ComboboxInput placeholder="Search staff..." />
                <ComboboxEmpty>No staff found.</ComboboxEmpty>
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
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={today}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue="PRESENT">
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={AttendanceStatus.PRESENT}>
                  Present
                </SelectItem>
                <SelectItem value={AttendanceStatus.ABSENT}>Absent</SelectItem>
                <SelectItem value={AttendanceStatus.LATE}>Late</SelectItem>
                <SelectItem value={AttendanceStatus.LEAVE}>Leave</SelectItem>
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
