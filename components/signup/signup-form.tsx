"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import { signup } from "@/app/actions/auth";
import type { SignupActionState } from "@/app/lib/validations/signup-schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";
import { useTranslations } from "next-intl";
import { enumLabel, USER_ROLE_LABELS } from "@/lib/enum-labels";
import { UserRole } from "@/app/generated/prisma/enums";
import { useRouter } from "@/i18n/navigation";

const initialState: SignupActionState = {
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("SignupForm");

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? t("buttons.creating") : t("buttons.submit")}
    </Button>
  );
}

type FieldErrorProps = {
  errors?: string[];
};

function FieldError({ errors }: FieldErrorProps) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}

export function SignupForm() {
  const router = useRouter();
  const t = useTranslations("SignupForm");
  const [state, action] = useActionState(signup, initialState);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? t('messages.createdFallback'));
      if (state.redirectTo) {
        router.push(state.redirectTo);
      }
      return;
    }

    if (state.message) {
      toast.error(state.message);
    }
  }, [router, state, t]);

  return (
    <Card className="w-full border-border/70">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("description", {
            role: enumLabel(UserRole.SCHOOL_SUPER_ADMIN, USER_ROLE_LABELS),
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="schoolName">{t("fields.schoolName.label")}</Label>
            <Input
              id="schoolName"
              name="schoolName"
              placeholder={t("fields.schoolName.placeholder")}
              required
            />
            <FieldError errors={state.fieldErrors?.schoolName} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="adminName">{t("fields.adminName.label")}</Label>
            <Input
              id="adminName"
              name="adminName"
              placeholder={t("fields.adminName.placeholder")}
              required
            />
            <FieldError errors={state.fieldErrors?.adminName} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">{t("fields.email.label")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("fields.email.placeholder")}
              required
            />
            <FieldError errors={state.fieldErrors?.email} />
          </div>

          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">{t("fields.password.label")}</Label>
              <InputGroup>
                <InputGroupInput
                  id="password"
                  name="password"
                  type={isPasswordVisible ? "text" : "password"}
                  required
                  className="pr-10"
                />

                <InputGroupAddon align={"inline-end"}>
                  <InputGroupButton
                    type="button"
                    aria-label={
                      isPasswordVisible
                        ? t("fields.password.hide")
                        : t("fields.password.show")
                    }
                    size="icon-xs"
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                  >
                    {isPasswordVisible ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>

              <FieldError errors={state.fieldErrors?.password} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">
                {t("fields.confirmPassword.label")}
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type={isConfirmVisible ? "text" : "password"}
                  required
                  className="pr-10"
                />

                <InputGroupAddon align={"inline-end"}>
                  <InputGroupButton
                    type="button"
                    aria-label={
                      isConfirmVisible
                        ? t("fields.confirmPassword.hide")
                        : t("fields.confirmPassword.show")
                    }
                    size="icon-xs"
                    onClick={() => setIsConfirmVisible((prev) => !prev)}
                  >
                    {isConfirmVisible ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldError errors={state.fieldErrors?.confirmPassword} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">{t("fields.phone.label")}</Label>
            <Input
              id="phone"
              name="phone"
              placeholder={t("fields.phone.placeholder")}
            />
            <FieldError errors={state.fieldErrors?.phone} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">{t("fields.slug.label")}</Label>
            <Input
              id="slug"
              name="slug"
              placeholder={t("fields.slug.placeholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("fields.slug.hint")}
            </p>
            <FieldError errors={state.fieldErrors?.slug} />
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
