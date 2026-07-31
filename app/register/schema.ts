import { z } from "zod";

export const registerSchema = z
  .object({
    // Step 1 - Account
    fullName: z
      .string()
      .min(3, "Full Name must be at least 3 characters"),

    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),

    email: z
      .string()
      .email("Enter a valid email address"),

    profileType: z.enum(["Male", "Female"]),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),

    confirmPassword: z
      .string()
      .min(8, "Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type RegisterSchema = z.infer<typeof registerSchema>;