"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { UserRole } from "@/app/generated/prisma/enums";
import {
  deleteStaff,
  resetStaffPassword,
  resetStaffTwoFactor,
  type StaffActionState,
} from "@/app/(school)/school/staff/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: StaffActionState = { status: "idle" };

function canManageSecurity(actorRole: UserRole, targetRole: UserRole) {
  if (actorRole === UserRole.SCHOOL_SUPER_ADMIN) {
    return targetRole === UserRole.SCHOOL_ADMIN || targetRole === UserRole.TEACHER;
  }

  if (actorRole === UserRole.SUPER_ADMIN) {
    return (
      targetRole === UserRole.SCHOOL_SUPER_ADMIN ||
      targetRole === UserRole.SCHOOL_ADMIN ||
      targetRole === UserRole.TEACHER
    );
  }

  return false;
}

export function StaffRowActionsMenu({
  staffId,
  targetUserId,
  actorRole,
  targetRole,
}: {
  staffId: string;
  targetUserId: string;
  actorRole: UserRole;
  targetRole: UserRole;
}) {
  const router = useRouter();
  const t = useTranslations("SchoolEntities.staff.table");
  const securityT = useTranslations("SchoolEntities.staff.table.securityActions");
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const showSecurityActions = canManageSecurity(actorRole, targetRole);

  const onView = () => {
    router.push(`/school/staff/${staffId}`);
  };

  const onEdit = () => {
    router.push(`/school/staff/${staffId}/edit`);
  };

  const onDelete = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", staffId);

      try {
        await deleteStaff(formData);
        setOpen(false);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t("actions.delete");
        toast.error(message);
      }
    });
  };

  const onResetTwoFactor = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("targetUserId", targetUserId);
      const result = await resetStaffTwoFactor(initialState, formData);

      if (result.status === "success") {
        toast.success(result.message ?? securityT("messages.twoFactorReset"));
        setOpen(false);
        router.refresh();
        return;
      }

      toast.error(result.message ?? securityT("messages.twoFactorResetFailed"));
    });
  };

  const onResetPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set("targetUserId", targetUserId);

    startTransition(async () => {
      const result = await resetStaffPassword(initialState, formData);

      if (result.status === "success") {
        toast.success(result.message ?? securityT("messages.passwordReset"));
        setPasswordDialogOpen(false);
        setOpen(false);
        router.refresh();
        return;
      }

      toast.error(result.message ?? securityT("messages.passwordResetFailed"));
    });
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={t("actions.more")}
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem disabled={pending} onSelect={onView}>
            {t("actions.view")}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={pending} onSelect={onEdit}>
            {t("actions.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            variant="destructive"
            onSelect={onDelete}
          >
            {t("actions.delete")}
          </DropdownMenuItem>

          {showSecurityActions ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={pending} onSelect={onResetTwoFactor}>
                {securityT("buttons.resetTwoFactor")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={pending}
                onSelect={() => setPasswordDialogOpen(true)}
              >
                {securityT("buttons.resetPassword")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{securityT("dialog.title")}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onResetPassword}>
            <div className="grid gap-2">
              <Label htmlFor={`new-password-${targetUserId}`}>
                {securityT("dialog.newPassword")}
              </Label>
              <Input
                id={`new-password-${targetUserId}`}
                name="newPassword"
                type="password"
                minLength={8}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`confirm-password-${targetUserId}`}>
                {securityT("dialog.confirmPassword")}
              </Label>
              <Input
                id={`confirm-password-${targetUserId}`}
                name="confirmPassword"
                type="password"
                minLength={8}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
              >
                {securityT("dialog.cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending
                  ? securityT("dialog.submitting")
                  : securityT("dialog.submit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
