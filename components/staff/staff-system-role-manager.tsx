"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
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
  const [demoteConfirmOpen, setDemoteConfirmOpen] = useState(false);
  const promoteFormRef = useRef<HTMLFormElement | null>(null);
  const demoteFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "System role updated.");
      if (state.shouldLogout) {
        void signOut({ callbackUrl: state.redirectTo ?? "/login" });
        return;
      }
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
                Promote to Admin
              </Button>
            </form>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Promote to School Admin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will grant{" "}
                    {enumLabel(UserRole.SCHOOL_ADMIN, USER_ROLE_LABELS)} access
                    for this account. Continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
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
          <>
            <form ref={demoteFormRef} action={formAction}>
              <input type="hidden" name="targetUserId" value={userId} />
              <input type="hidden" name="nextRole" value={UserRole.TEACHER} />
              <Button
                type="button"
                variant="outline"
                onClick={() => setDemoteConfirmOpen(true)}
              >
                Demote to Teacher
              </Button>
            </form>

            <AlertDialog
              open={demoteConfirmOpen}
              onOpenChange={setDemoteConfirmOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Demote to Teacher?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove{" "}
                    {enumLabel(UserRole.SCHOOL_ADMIN, USER_ROLE_LABELS)} access
                    for this account. If you are demoting yourself, your current
                    session will end and you will be redirected to login.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      demoteFormRef.current?.requestSubmit();
                      setDemoteConfirmOpen(false);
                    }}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : null}
      </div>
    </div>
  );
}
