"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCourse, type CourseActionState } from "@/app/(school)/courses/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const initialState: CourseActionState = { status: "idle" };

export function CourseRowActions({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const runDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      const state = await deleteCourse(initialState, formData);
      if (state.status === "success") {
        toast.success(state.message ?? "Course deleted");
        setOpen(false);
        router.refresh();
        return;
      }
      if (state.status === "error") {
        toast.error(state.message ?? "Unable to delete course");
      }
    });
  };

  return (
    <div className="flex justify-end gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={`/courses/${id}/edit`}>Edit</Link>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={pending}>
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete course</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will delete <strong>{name}</strong>. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={runDelete}>
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
