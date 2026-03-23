import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const signupSchema = z
  .object({
    schoolName: z.string().trim().min(2, "School name must be at least 2 characters."),
    adminName: z.string().trim().min(2, "Admin name is required."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm password is required."),
    phone: z
      .string()
      .trim()
      .max(20, "Phone is too long.")
      .optional()
      .or(z.literal("")),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens only.")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export type SignupInput = z.infer<typeof signupSchema>;

export type SignupActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
};

