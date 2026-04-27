"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  markTeacherAttendance,
  TeacherActionState,
  getSectionsByStudentId,
} from "@/app/(teacher)/teacher/actions";
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
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../ui/combobox";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

const initialState: TeacherActionState = { status: "idle" };

type EnrollmentOption = {
  id: string;
  name: string;
};

export function TeacherAttendanceForm({
  students,
  defaultDate,
}: {
  students: EnrollmentOption[];
  defaultDate: string;
}) {
  const t = useTranslations("SchoolEntities.attendance.form");
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    TeacherActionState,
    FormData
  >(markTeacherAttendance, initialState);

  const [selectedStudent, setSelectedStudent] =
    useState<EnrollmentOption | null>(null);
  const [selectedSection, setSelectedSection] =
    useState<EnrollmentOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [filteredSections, setFilteredSections] = useState<EnrollmentOption[]>(
    [],
  );
  const lastHandledKeyRef = useRef<string>("");

  useEffect(() => {
    if (pending) lastHandledKeyRef.current = "";
  }, [pending]);

  // Filter sections based on selected student
  useEffect(() => {
    const filterSections = async () => {
      if (!selectedStudent) {
        setFilteredSections([]);
        setSelectedSection(null);
        return;
      }

      try {
        // Fetch sections from backend based on student ID
        const studentSections = await getSectionsByStudentId(
          selectedStudent.id,
        );

        setFilteredSections(studentSections);

        // Reset selected section if it's not in the filtered list
        if (
          selectedSection &&
          !studentSections.find((s) => s.id === selectedSection.id)
        ) {
          setSelectedSection(null);
        }
      } catch (error) {
        console.error("Error fetching sections:", error);
        setFilteredSections([]);
        setSelectedSection(null);
      }
    };

    filterSections();
  }, [selectedStudent?.id, selectedStudent, selectedSection]);

  useEffect(() => {
    if (state.status === "idle") return;

    const key = `${state.msgID}:${state.status}:${state.message ?? ""}`;
    if (lastHandledKeyRef.current === key) return;
    lastHandledKeyRef.current = key;

    if (state.status === "success") {
      toast.success(state.message ?? t("messages.saved"));
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? t("messages.saveFailed"));
    }
  }, [router, state, t]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="studentId" value={selectedStudent?.id ?? ""} />

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="studentId">{t("student")}</Label>
            <Combobox
              items={students}
              value={selectedStudent}
              onValueChange={(value: EnrollmentOption | null) => {
                setSelectedStudent(value);
              }}
              itemToStringLabel={(item) => item?.name ?? ""}
            >
              <ComboboxInput id="studentId" placeholder={t("selectStudent")} />
              <ComboboxContent>
                <ComboboxEmpty>{t("noItemsFound")}</ComboboxEmpty>
                <ComboboxList>
                  {(item: EnrollmentOption) => (
                    <ComboboxItem key={item.id} value={item}>
                      {item.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sectionId">{t("section")}</Label>
            <NativeSelect
              name="sectionId"
              disabled={!selectedStudent || filteredSections.length === 0}
              className="w-full"
            >
              <NativeSelectOption value="">
                {t("selectSection")}
              </NativeSelectOption>
              {filteredSections.map((section) => (
                <NativeSelectOption key={section.id} value={section.id}>
                  {section.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">{t("date")}</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">{t("status")}</Label>
            <Select name="status" defaultValue="PRESENT">
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder={t("selectStatus")} />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="PRESENT">
                  {t("statusOptions.present")}
                </SelectItem>
                <SelectItem value="ABSENT">
                  {t("statusOptions.absent")}
                </SelectItem>
                <SelectItem value="LATE">{t("statusOptions.late")}</SelectItem>
                <SelectItem value="LEAVE">
                  {t("statusOptions.leave")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton label={t("save")} loadingLabel={t("saving")} />
      </div>
    </form>
  );
}
