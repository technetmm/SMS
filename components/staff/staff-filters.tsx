"use client";

import React from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { TableFilterSelect } from "../shared/table-filter-select";
import { Button } from "../ui/button";
import { parseTextParam, TABLE_FILTER_ALL_VALUE } from "@/lib/table-filters";
import { useTranslations } from "next-intl";

export function StaffFilters({
  q,
  status,
  role,
  hireFrom,
  hireTo,
}: {
  q?: string;
  status?: string;
  role?: string;
  hireFrom?: string;
  hireTo?: string;
}) {
  const t = useTranslations("SchoolEntities.staff.filters");
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
        id="role"
        name="role"
        label={t("role")}
        placeholder={t("allRoles")}
        defaultValue={role ?? TABLE_FILTER_ALL_VALUE}
        options={[
          { value: "SCHOOL_ADMIN", label: t("roleOptions.schoolAdmin") },
          { value: "TEACHER", label: t("roleOptions.teacher") },
        ]}
      />
      <TableFilterSelect
        id="status"
        name="status"
        label={t("status")}
        placeholder={t("allStatuses")}
        defaultValue={status ?? TABLE_FILTER_ALL_VALUE}
        options={[
          { value: "ACTIVE", label: t("statusOptions.active") },
          { value: "ONLEAVE", label: t("statusOptions.onLeave") },
          { value: "RESIGNED", label: t("statusOptions.resigned") },
          { value: "TERMINATED", label: t("statusOptions.terminated") },
        ]}
      />
      <div className="grid gap-2">
        <Label htmlFor="hireFrom">{t("hireFrom")}</Label>
        <Input
          id="hireFrom"
          name="hireFrom"
          type="date"
          defaultValue={parseTextParam(hireFrom)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="hireTo">{t("hireTo")}</Label>
        <Input
          id="hireTo"
          name="hireTo"
          type="date"
          defaultValue={parseTextParam(hireTo)}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">{t("apply")}</Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/staff")}
        >
          {t("reset")}
        </Button>
      </div>
    </form>
  );
}
