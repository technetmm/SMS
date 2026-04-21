"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  markAttendance,
  type EnrollmentActionState,
} from "@/app/(school)/school/enrollments/actions";
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
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

const initialState: EnrollmentActionState = { status: "idle" };

type EnrollmentOption = {
  id: string;
  label: string;
};

export function EnrollmentAttendanceForm({
  enrollments,
  defaultDate,
}: {
  enrollments: EnrollmentOption[];
  defaultDate: string;
}) {
  const t = useTranslations("SchoolEntities.attendance.form");
  const router = useRouter();
  const [state, formAction] = useActionState(markAttendance, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? t("messages.saved"));
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? t("messages.saveFailed"));
    }
  }, [router, state, t]);

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="enrollmentId">{t("enrollment")}</Label>
            <Select name="enrollmentId">
              <SelectTrigger id="enrollmentId" className="w-full">
                <SelectValue placeholder={t("selectEnrollment")} />
              </SelectTrigger>
              <SelectContent position="popper">
                {enrollments.map((enrollment) => (
                  <SelectItem key={enrollment.id} value={enrollment.id}>
                    {enrollment.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">{t("date")}</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={defaultDate}
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
                <SelectItem value="PRESENT">{t("statusOptions.present")}</SelectItem>
                <SelectItem value="ABSENT">{t("statusOptions.absent")}</SelectItem>
                <SelectItem value="LATE">{t("statusOptions.late")}</SelectItem>
                <SelectItem value="LEAVE">{t("statusOptions.leave")}</SelectItem>
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
