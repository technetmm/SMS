"use client";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { TableFilterSelect } from "@/components/shared/table-filter-select";
import { Button } from "@/components/ui/button";
import { parseTextParam } from "@/lib/table-filters";
import { useTranslations } from "next-intl";

export function StaffAttendanceFilter({
  q,
  status,
  dateFrom,
  dateTo,
}: {
  q?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const t = useTranslations("SchoolEntities.staffAttendance.filters");
  const commonT = useTranslations("Common");

  return (
    <form className="grid gap-4 md:grid-cols-4" method="get">
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="q">{t("search")}</Label>
        <Input
          id="q"
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
        />
      </div>
      <TableFilterSelect
        id="status"
        name="status"
        label={t("status")}
        placeholder={t("allStatuses")}
        defaultValue={status}
        options={[
          { value: "PRESENT", label: t("statusOptions.present") },
          { value: "ABSENT", label: t("statusOptions.absent") },
          { value: "LATE", label: t("statusOptions.late") },
          { value: "LEAVE", label: t("statusOptions.leave") },
        ]}
      />
      <div className="grid gap-2">
        <Label htmlFor="dateFrom">{t("dateFrom")}</Label>
        <Input
          id="dateFrom"
          name="dateFrom"
          type="date"
          defaultValue={parseTextParam(dateFrom)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dateTo">{t("dateTo")}</Label>
        <Input
          id="dateTo"
          name="dateTo"
          type="date"
          defaultValue={parseTextParam(dateTo)}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">{commonT("apply")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/staff-attendance")}
        >
          {commonT("reset")}
        </Button>
      </div>
    </form>
  );
}
