"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  deleteEnrollment,
  type EnrollmentActionState,
} from "@/app/(school)/school/enrollments/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialState: EnrollmentActionState = { status: "idle" };

export function EnrollmentRowActions({
  id,
  studentName,
}: {
  id: string;
  studentName: string;
}) {
  const t = useTranslations("SchoolEntities.enrollments.rowActions");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const runDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);

      const state = await deleteEnrollment(initialState, formData);
      if (state.status === "success") {
        toast.success(state.message ?? t("messages.deleted"));
        setOpen(false);
        router.refresh();
        return;
      }

      if (state.status === "error") {
        toast.error(state.message ?? t("messages.deleteFailed"));
      }
    });
  };

  return (
    <div className="flex justify-end gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={`/school/enrollments/${id}/edit`}>{t("edit")}</Link>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={pending}>
            {t("delete")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialog.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("dialog.description", { studentName })}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={runDelete}>
              {pending ? t("deleting") : t("delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
