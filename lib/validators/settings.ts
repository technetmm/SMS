import { Currency } from "@/app/generated/prisma/enums";
import { z } from "zod";

export const changeEmailSchema = z.object({
  newEmail: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const schoolProfileSchema = z.object({
  name: z.string().trim().min(2, "School name must be at least 2 characters."),
  slug: z.string().trim().min(2, "Slug is required."),
  currency: z.nativeEnum(Currency, {
    errorMap: () => ({ message: "Select a valid currency." }),
  }),
  billingDayOfMonth: z.coerce
    .number()
    .int("Billing day must be a whole number")
    .min(1, "Billing day must be between 1 and 28")
    .max(28, "Billing day must be between 1 and 28"),
});
