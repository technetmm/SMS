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
