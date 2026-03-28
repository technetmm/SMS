"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/app/generated/prisma/enums";
import {
  type StaffSystemRoleActionState,
  setStaffSystemRole,
} from "@/app/(school)/school/staff/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { enumLabel, USER_ROLE_LABELS } from "@/lib/enum-labels";

const initialState: StaffSystemRoleActionState = { status: "idle" };

type StaffSystemRoleManagerProps = {
  userId: string;
  currentRole: UserRole;
};

export function StaffSystemRoleManager({
  userId,
  currentRole,
}: StaffSystemRoleManagerProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(setStaffSystemRole, initialState);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const promoteFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "System role updated.");
      router.refresh();
      return;
    }
    if (state.status === "error") {
      toast.error(state.message ?? "Unable to update system role.");
    }
  }, [router, state]);

  const canPromote = currentRole !== UserRole.SCHOOL_ADMIN;
  const canDemote = currentRole === UserRole.SCHOOL_ADMIN;

  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm font-medium">
        System Role: {enumLabel(currentRole, USER_ROLE_LABELS)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Update this staff account system role.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {canPromote ? (
          <>
            <form ref={promoteFormRef} action={formAction}>
              <input type="hidden" name="targetUserId" value={userId} />
              <input
                type="hidden"
                name="nextRole"
                value={UserRole.SCHOOL_ADMIN}
              />
              <Button type="button" onClick={() => setConfirmOpen(true)}>
                Promote to School Admin
              </Button>
            </form>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Promote to School Admin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will grant school-admin access for this account.
                    Continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      promoteFormRef.current?.requestSubmit();
                      setConfirmOpen(false);
                    }}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : null}

        {canDemote ? (
          <form action={formAction}>
            <input type="hidden" name="targetUserId" value={userId} />
            <input type="hidden" name="nextRole" value={UserRole.TEACHER} />
            <Button type="submit" variant="outline">
              Demote to Teacher
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
