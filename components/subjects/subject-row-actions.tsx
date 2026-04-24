"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { deleteSubject, type SubjectActionState } from "@/app/(school)/school/subjects/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const initialState: SubjectActionState = { status: "idle" };

export function SubjectRowActions({ id, name }: { id: string; name: string }) {
  const t = useTranslations("SchoolEntities.subjects.rowActions");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const runDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      const state = await deleteSubject(initialState, formData);
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
        <Link href={`/school/subjects/${id}/edit`}>{t("edit")}</Link>
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
            {t("dialog.description", { name })}
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
