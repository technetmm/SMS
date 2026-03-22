"use client";

import { useActionState } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteStudent } from "@/app/(dashboard)/students/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: ActionState = { status: "idle" };

export function StudentRowActions({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(deleteStudent, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Student deleted");
      setOpen(false);
      router.refresh();
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to delete student");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete student</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will permanently remove {name}. This action cannot be undone.
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
  );
}
