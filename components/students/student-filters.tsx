"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableFilterSelect } from "@/components/shared/table-filter-select";
import { useTranslations } from "next-intl";

export function StudentFilters({
  query,
  status,
  gender,
  admissionFrom,
  admissionTo,
}: {
  query?: string;
  status?: string;
  gender?: string;
  admissionFrom?: string;
  admissionTo?: string;
}) {
  const t = useTranslations("SchoolEntities.students.filters");
  const commonT = useTranslations("Common");

  return (
    <form className="grid gap-3 md:grid-cols-3">
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="q">
          {t("search")}
        </label>
        <Input
          id="q"
          name="q"
          placeholder={t("searchPlaceholder")}
          defaultValue={query}
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
          { value: "INACTIVE", label: t("statusOptions.inactive") },
          { value: "GRADUATED", label: t("statusOptions.graduated") },
        ]}
      />
      <TableFilterSelect
        id="gender"
        name="gender"
        label={t("gender")}
        placeholder={t("allGenders")}
        defaultValue={gender}
        options={[
          { value: "MALE", label: t("genderOptions.male") },
          { value: "FEMALE", label: t("genderOptions.female") },
          { value: "OTHER", label: t("genderOptions.other") },
        ]}
      />
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="admissionFrom">
          {t("admissionFrom")}
        </label>
        <Input
          id="admissionFrom"
          name="admissionFrom"
          type="date"
          defaultValue={admissionFrom}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="admissionTo">
          {t("admissionTo")}
        </label>
        <Input
          id="admissionTo"
          name="admissionTo"
          type="date"
          defaultValue={admissionTo}
        />
      </div>
      <div className="flex gap-2 items-end">
        <Button type="submit">{commonT("apply")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/students")}
        >
          {commonT("reset")}
        </Button>
      </div>
    </form>
  );
}
