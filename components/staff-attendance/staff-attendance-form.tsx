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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("SchoolEntities.staffAttendance.form");
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialState);
  const staffAnchor = useComboboxAnchor();
  const sectionAnchor = useComboboxAnchor();

  const [selectedStaff, setSelectedStaff] = useState<Option | null>(null);
  const [selectedSection, setSelectedSection] = useState<Option | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? t("messages.saved"));
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? t("messages.saveFailed"));
    }
  }, [router, state, t]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!selectedStaff) {
      event.preventDefault();
      toast.error(t("messages.selectStaff"));
      return;
    }
    if (!selectedSection) {
      event.preventDefault();
      toast.error(t("messages.selectSection"));
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
            <Label>{t("section")}</Label>
            <Combobox
              items={sections}
              value={selectedSection}
              onValueChange={(value: Option | null) =>
                setSelectedSection(value)
              }
              itemToStringLabel={(item) => item?.name ?? ""}
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
            <Label htmlFor="date">{t("date")}</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={today}
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
