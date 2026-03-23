"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCourse, type CourseActionState } from "@/app/(school)/courses/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const initialState: CourseActionState = { status: "idle" };

export function CourseRowActions({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(deleteCourse, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Course deleted");
      setOpen(false);
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to delete course");
    }
  }, [router, state]);

  return (
    <div className="flex justify-end gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={`/courses/${id}/edit`}>Edit</Link>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive">
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
          <form action={formAction} className="flex justify-end gap-2">
            <input type="hidden" name="id" value={id} />
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

