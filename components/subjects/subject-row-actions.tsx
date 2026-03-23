"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteSubject, type SubjectActionState } from "@/app/(school)/subjects/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const initialState: SubjectActionState = { status: "idle" };

export function SubjectRowActions({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(deleteSubject, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Subject deleted");
      setOpen(false);
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to delete subject");
    }
  }, [router, state]);

  return (
    <div className="flex justify-end gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={`/subjects/${id}/edit`}>Edit</Link>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive">
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete subject</DialogTitle>
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

