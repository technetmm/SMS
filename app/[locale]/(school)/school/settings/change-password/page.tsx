import { ChangePasswordForm } from "@/components/settings/change-password-form";

export default function ChangePasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Security
        </p>
        <h2 className="text-2xl font-semibold">Change Password</h2>
        <p className="text-sm text-muted-foreground">
          Update your password and keep your account secure.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
