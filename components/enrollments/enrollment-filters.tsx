"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TableFilterSelect } from "@/components/shared/table-filter-select";
import { parseTextParam } from "@/lib/table-filters";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function EnrollmentFilters({
  q,
  status,
  enrolledFrom,
  enrolledTo,
}: {
  q?: string;
  status?: string;
  enrolledFrom?: string;
  enrolledTo?: string;
}) {
  const t = useTranslations("SchoolEntities.enrollments.filters");
  return (
    <form method="get" className="grid gap-4 md:grid-cols-4">
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
          { value: "ACTIVE", label: t("statusOptions.active") },
          { value: "COMPLETED", label: t("statusOptions.completed") },
          { value: "DROPPED", label: t("statusOptions.dropped") },
        ]}
      />
      <div className="grid gap-2">
        <Label htmlFor="enrolledFrom">{t("enrolledFrom")}</Label>
        <Input
          id="enrolledFrom"
          name="enrolledFrom"
          type="date"
          defaultValue={parseTextParam(enrolledFrom)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="enrolledTo">{t("enrolledTo")}</Label>
        <Input
          id="enrolledTo"
          name="enrolledTo"
          type="date"
          defaultValue={parseTextParam(enrolledTo)}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">{t("apply")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/enrollments")}
        >
          {t("reset")}
        </Button>
      </div>
    </form>
  );
}
