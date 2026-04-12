"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const initialState: SignupActionState = {
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating school..." : "Create School Account"}
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
  const [state, action] = useActionState(signup, initialState);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Account created.");
      if (state.redirectTo) {
        router.push(state.redirectTo);
      }
      return;
    }

    if (state.message) {
      toast.error(state.message);
    }
  }, [router, state]);

  return (
    <Card className="w-full border-border/70">
      <CardHeader>
        <CardTitle>Create your school workspace</CardTitle>
        <CardDescription>
          We will create a new tenant and your SCHOOL_SUPER_ADMIN account in
          one secure step.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="schoolName">School Name</Label>
            <Input
              id="schoolName"
              name="schoolName"
              placeholder="Future Academy"
              required
            />
            <FieldError errors={state.fieldErrors?.schoolName} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="adminName">Admin Name</Label>
            <Input
              id="adminName"
              name="adminName"
              placeholder="Jane Doe"
              required
            />
            <FieldError errors={state.fieldErrors?.adminName} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@school.com"
              required
            />
            <FieldError errors={state.fieldErrors?.email} />
          </div>

          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
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
                      isPasswordVisible ? "Hide password" : "Show password"
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
              <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                      isConfirmVisible ? "Hide password" : "Show password"
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
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" name="phone" placeholder="+95 9..." />
            <FieldError errors={state.fieldErrors?.phone} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Subdomain Slug (optional)</Label>
            <Input id="slug" name="slug" placeholder="future-academy" />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only.
            </p>
            <FieldError errors={state.fieldErrors?.slug} />
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
