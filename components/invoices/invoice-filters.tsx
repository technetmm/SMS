"use client";

import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";
import { TableFilterSelect } from "../shared/table-filter-select";
import { parseTextParam } from "@/lib/table-filters";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";

export function InvoicesFilters({
  q,
  status,
  invoiceType,
  dueFrom,
  dueTo,
  finalMin,
  finalMax,
}: {
  q?: string;
  status?: string;
  invoiceType?: string;
  dueFrom?: string;
  dueTo?: string;
  finalMin?: number;
  finalMax?: number;
}) {
  const t = useTranslations("SchoolEntities.invoices.filters");
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
          { value: "UNPAID", label: t("statusOptions.unpaid") },
          { value: "PARTIAL", label: t("statusOptions.partial") },
          { value: "PAID", label: t("statusOptions.paid") },
        ]}
      />
      <TableFilterSelect
        id="invoiceType"
        name="invoiceType"
        label={t("invoiceType")}
        placeholder={t("allInvoiceTypes")}
        defaultValue={invoiceType}
        options={[
          { value: "ONE_TIME", label: t("invoiceTypeOptions.oneTime") },
          { value: "MONTHLY", label: t("invoiceTypeOptions.monthly") },
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
        <Label htmlFor="finalMin">{t("finalMin")}</Label>
        <Input
          id="finalMin"
          name="finalMin"
          type="number"
          step="0.01"
          defaultValue={finalMin}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="finalMax">{t("finalMax")}</Label>
        <Input
          id="finalMax"
          name="finalMax"
          type="number"
          step="0.01"
          defaultValue={finalMax}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit">{commonT("apply")}</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/school/invoices")}
        >
          {commonT("reset")}
        </Button>
      </div>
    </form>
  );
}
