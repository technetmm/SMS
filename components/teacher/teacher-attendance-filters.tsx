"use client";

import { TableFilterSelect } from "@/components/shared/table-filter-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { parseTextParam } from "@/lib/table-filters";
import { useTranslations } from "next-intl";

export function TeacherAttendanceFilters({
  q,
  studentId,
  sectionId,
  status,
  date,
  dateFrom,
  dateTo,
  students,
  sections,
}: {
  q?: string;
  studentId?: string;
  sectionId?: string;
  status?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  students: { id: string; name: string }[];
  sections: { id: string; name: string; class: { name: string } }[];
}) {
  const t = useTranslations("SchoolEntities.attendance.filters");
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
        id="studentId"
        name="studentId"
        label={t("student")}
        placeholder={t("allStudents")}
        defaultValue={studentId}
        allLabel={t("allStudents")}
        options={students.map((student) => ({
          value: student.id,
          label: student.name,
        }))}
      />

      <TableFilterSelect
        id="sectionId"
        name="sectionId"
        label={t("section")}
        placeholder={t("allSections")}
        defaultValue={sectionId}
        allLabel={t("allSections")}
        options={sections.map((section) => ({
          value: section.id,
          label: `${section.class.name} • ${section.name}`,
        }))}
      />

      <div className="grid gap-2">
        <Label htmlFor="date">{t("date")}</Label>
        <Input id="date" name="date" type="date" defaultValue={date ?? ""} />
      </div>

      <TableFilterSelect
        id="status"
        name="status"
        label={t("status")}
        placeholder={t("allStatuses")}
        defaultValue={status}
        allLabel={t("allStatuses")}
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
        <Button type="submit" variant="default">
          {commonT("apply")}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/teacher/attendance")}
        >
          {commonT("reset")}
        </Button>
      </div>
    </form>
  );
}
