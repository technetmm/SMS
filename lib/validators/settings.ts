import { Currency } from "@/app/generated/prisma/enums";
import { z } from "zod";

export const changeEmailSchema = z.object({
  newEmail: z.string().email("validation.changeEmail.invalidEmail"),
  password: z.string().min(8, "validation.shared.passwordRequired"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "validation.changePassword.currentPasswordRequired"),
    newPassword: z
      .string()
      .min(8, "validation.changePassword.newPasswordMin"),
    confirmPassword: z
      .string()
      .min(8, "validation.changePassword.confirmPasswordRequired"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "validation.changePassword.passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

export const schoolProfileSchema = z.object({
  name: z.string().trim().min(2, "validation.schoolProfile.nameMin"),
  slug: z.string().trim().min(2, "validation.schoolProfile.slugRequired"),
  currency: z.nativeEnum(Currency, {
    errorMap: () => ({ message: "validation.schoolProfile.currencyInvalid" }),
  }),
  billingDayOfMonth: z.coerce
    .number()
    .int("validation.schoolProfile.billingDayInteger")
    .min(1, "validation.schoolProfile.billingDayRange")
    .max(28, "validation.schoolProfile.billingDayRange"),
});
