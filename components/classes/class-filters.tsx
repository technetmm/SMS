"use client";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { TableFilterSelect } from "../shared/table-filter-select";
import { Button } from "../ui/button";
import { parseTextParam } from "@/lib/table-filters";
import { useTranslations } from "next-intl";

export function ClassFilters({
  q,
  classType,
  programType,
  billingType,
  createdFrom,
  createdTo,
  feeMin,
  feeMax,
}: {
  q?: string;
  classType?: string;
  programType?: string;
  billingType?: string;
  createdFrom?: string;
  createdTo?: string;
  feeMin?: string;
  feeMax?: string;
}) {
  const t = useTranslations("SchoolEntities.classes.filters");
  const commonT = useTranslations("Common");
  return (
    <form className="grid gap-4 md:grid-cols-4" method="get">
      <div className="grid gap-2">
        <Label htmlFor="q">{t("search")}</Label>
        <Input
          id="q"
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
        />
      </div>
      <TableFilterSelect
        id="classType"
        name="classType"
        label={t("classType")}
        placeholder={t("allClassTypes")}
        defaultValue={classType}
        options={[
          { value: "ONE_ON_ONE", label: t("classTypeOptions.oneOnOne") },
          { value: "PRIVATE", label: t("classTypeOptions.private") },
          { value: "GROUP", label: t("classTypeOptions.group") },
        ]}
      />
      <TableFilterSelect
        id="programType"
        name="programType"
        label={t("programType")}
        placeholder={t("allProgramTypes")}
        defaultValue={programType}
        options={[
          { value: "REGULAR", label: t("programTypeOptions.regular") },
          { value: "INTENSIVE", label: t("programTypeOptions.intensive") },
        ]}
      />
      <TableFilterSelect
        id="billingType"
        name="billingType"
        label={t("billingType")}
        placeholder={t("allBillingTypes")}
        defaultValue={billingType}
        options={[
          { value: "ONE_TIME", label: t("billingTypeOptions.oneTime") },
          { value: "MONTHLY", label: t("billingTypeOptions.monthly") },
        ]}
      />
      <div className="grid gap-2">
        <Label htmlFor="createdFrom">{t("createdFrom")}</Label>
        <Input
          id="createdFrom"
          name="createdFrom"
          type="date"
          defaultValue={parseTextParam(createdFrom)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="createdTo">{t("createdTo")}</Label>
        <Input
          id="createdTo"
          name="createdTo"
          type="date"
          defaultValue={parseTextParam(createdTo)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="feeMin">{t("feeMin")}</Label>
        <Input
          id="feeMin"
          name="feeMin"
          type="number"
          step="0.01"
          defaultValue={feeMin}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="feeMax">{t("feeMax")}</Label>
        <Input
          id="feeMax"
          name="feeMax"
          type="number"
          step="0.01"
          defaultValue={feeMax}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">{commonT("apply")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/classes")}
        >
          {commonT("reset")}
        </Button>
      </div>
    </form>
  );
}
