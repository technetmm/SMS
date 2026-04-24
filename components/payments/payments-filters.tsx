"use client";

import { parseTextParam } from "@/lib/table-filters";
import { TableFilterSelect } from "../shared/table-filter-select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function PaymentsFilters({
  q,
  status,
  dueFrom,
  dueTo,
  totalMin,
  totalMax,
}: {
  q?: string;
  status?: string;
  dueFrom?: string;
  dueTo?: string;
  totalMin?: string;
  totalMax?: string;
}) {
  const t = useTranslations("SchoolEntities.payments.filters");
  const commonT = useTranslations("Common");

  return (
    <form className="mb-4 grid gap-4 md:grid-cols-4" method="get">
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
          { value: "UNPAID", label: t("statusOptions.unpaid") },
          { value: "PARTIAL", label: t("statusOptions.partial") },
          { value: "PAID", label: t("statusOptions.paid") },
        ]}
      />
      <div className="grid gap-2">
        <Label htmlFor="dueFrom">{t("dueFrom")}</Label>
        <Input
          id="dueFrom"
          name="dueFrom"
          type="date"
          defaultValue={parseTextParam(dueFrom)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dueTo">{t("dueTo")}</Label>
        <Input
          id="dueTo"
          name="dueTo"
          type="date"
          defaultValue={parseTextParam(dueTo)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="totalMin">{t("totalMin")}</Label>
        <Input
          id="totalMin"
          name="totalMin"
          type="number"
          step="0.01"
          defaultValue={totalMin}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="totalMax">{t("totalMax")}</Label>
        <Input
          id="totalMax"
          name="totalMax"
          type="number"
          step="0.01"
          defaultValue={totalMax}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">{commonT("apply")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/payments")}
        >
          {commonT("reset")}
        </Button>
      </div>
    </form>
  );
}
