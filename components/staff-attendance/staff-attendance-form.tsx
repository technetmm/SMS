"use client";

import { useActionState, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { StaffAttendanceActionState } from "@/app/(school)/school/staff-attendance/actions";
import { getSectionsByStaffAndDay } from "@/app/(school)/school/staff-attendance/actions";
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
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { AttendanceStatus } from "@/app/generated/prisma/enums";
import { Input } from "../ui/input";
import { useTranslations } from "next-intl";

const initialState: StaffAttendanceActionState = { status: "idle" };

type Option = { id: string; name: string };

type Props = {
  action: (
    prevState: StaffAttendanceActionState,
    formData: FormData,
  ) => Promise<StaffAttendanceActionState>;
  staff: Option[];
};

export function StaffAttendanceForm({ action, staff }: Props) {
  const t = useTranslations("SchoolEntities.staffAttendance.form");
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    StaffAttendanceActionState,
    FormData
  >(action, initialState);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedStaff, setSelectedStaff] = useState<Option | null>(null);
  const [selectedSection, setSelectedSection] = useState<Option | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [filteredSections, setFilteredSections] = useState<Option[]>([]);
  const lastHandledKeyRef = useRef<string>("");

  useEffect(() => {
    if (pending) lastHandledKeyRef.current = "";
  }, [pending]);

  useEffect(() => {
    if (state.status === "idle") return;

    const key = `${state?.msgID}:${state.status}:${state.message ?? ""}`;
    if (lastHandledKeyRef.current === key) return;
    lastHandledKeyRef.current = key;

    if (state.status === "success") {
      toast.success(state.message ?? t("messages.saved"));
      router.refresh();
    }

    if (state.status === "error") {
      toast.error(state.message ?? t("messages.saveFailed"));
    }
  }, [state, router, t]);

  // Filter sections based on selected staff and date
  useEffect(() => {
    const filterSections = async () => {
      if (!selectedStaff || !selectedDate) {
        setFilteredSections([]);
        setSelectedSection(null);
        return;
      }

      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

      const dayMap: { [key: number]: string } = {
        0: "SUN",
        1: "MON",
        2: "TUE",
        3: "WED",
        4: "THU",
        5: "FRI",
        6: "SAT",
      };

      const dayString = dayMap[dayOfWeek];

      try {
        // Fetch sections from backend based on staff ID and day of week
        const staffSections = await getSectionsByStaffAndDay(
          selectedStaff.id,
          dayString,
        );

        setFilteredSections(staffSections);

        // Reset selected section if it's not in the filtered list
        if (
          selectedSection &&
          !staffSections.find((s) => s.id === selectedSection.id)
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
  }, [selectedStaff?.id, selectedDate, selectedStaff, selectedSection]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!selectedStaff) {
      event.preventDefault();
      toast.error(t("messages.selectStaff"));
      return;
    }
    if (!selectedSection) {
      event.preventDefault();
      toast.error(t("messages.selectSection"));
      return;
    }
    if (!selectedDate) {
      event.preventDefault();
      toast.error(t("messages.selectDate"));
      return;
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="staffId" value={selectedStaff?.id ?? ""} />
      <input type="hidden" name="sectionId" value={selectedSection?.id ?? ""} />

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>{t("staff")}</Label>
            <Combobox
              items={staff}
              value={selectedStaff}
              onValueChange={(value: Option | null) => setSelectedStaff(value)}
              itemToStringLabel={(item) => item?.name ?? ""}
            >
              <ComboboxInput placeholder={t("searchStaff")} />
              <ComboboxContent>
                <ComboboxEmpty>{t("noStaffFound")}</ComboboxEmpty>
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
            <Label>{t("section")}</Label>
            <Combobox
              items={filteredSections}
              value={selectedSection}
              onValueChange={(value: Option | null) =>
                setSelectedSection(value)
              }
              itemToStringLabel={(item) => item?.name ?? ""}
              disabled={!selectedStaff || !selectedDate}
            >
              <ComboboxInput placeholder={t("searchSection")} />
              <ComboboxContent>
                <ComboboxEmpty>{t("noSectionsFound")}</ComboboxEmpty>
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
            <Label htmlFor="status">{t("status")}</Label>
            <Select name="status" defaultValue="PRESENT">
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder={t("selectStatus")} />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={AttendanceStatus.PRESENT}>
                  {t("statusOptions.present")}
                </SelectItem>
                <SelectItem value={AttendanceStatus.ABSENT}>
                  {t("statusOptions.absent")}
                </SelectItem>
                <SelectItem value={AttendanceStatus.LATE}>
                  {t("statusOptions.late")}
                </SelectItem>
                <SelectItem value={AttendanceStatus.LEAVE}>
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
