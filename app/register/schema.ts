import { z } from "zod";

export const registerSchema = z
  .object({
    // ==========================
    // Step 1 - Account Details
    // ==========================
    fullName: z.string().min(3, "Full Name must be at least 3 characters"),

    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),

    email: z.string().email("Enter a valid email address"),

    profileType: z.enum(["Male", "Female"]),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),

    confirmPassword: z
      .string()
      .min(8, "Confirm Password is required"),

    // ==========================
    // Step 2 - Personal Details
    // ==========================
    gender: z.string(),
    lookingFor: z.string(),
    dateOfBirth: z.string(),
    height: z.string(),
    weight: z.string().optional(),
    maritalStatus: z.string(),
    religion: z.string().optional(),
    caste: z.string().optional(),
    motherTongue: z.string().optional(),
    country: z.string(),
    state: z.string(),
    city: z.string(),
    postalCode: z.string().optional(),

    // ==========================
    // Step 3 - Education
    // ==========================
    highestQualification: z.string().optional(),
    college: z.string().optional(),
    occupationField: z.string().optional(),
    profession: z.string().optional(),
    company: z.string().optional(),
    annualIncome: z.string().optional(),

    // ==========================
    // Step 4 - Partner Preference
    // ==========================
    minAge: z.string().optional(),
    maxAge: z.string().optional(),
    minHeight: z.string().optional(),
    maxHeight: z.string().optional(),
    preferredReligion: z.string().optional(),
    preferredCaste: z.string().optional(),

    // ==========================
    // Step 5 - Family
    // ==========================
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    brothers: z.string().optional(),
    sisters: z.string().optional(),
    familyType: z.string().optional(),
    familyStatus: z.string().optional(),

    // ==========================
    // About & Photos
    // ==========================
    about: z.string().optional(),

    photos: z
      .array(z.string().url("Invalid photo URL"))
      .max(3, "Maximum 3 photos allowed")
      .default([]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type RegisterSchema = z.infer<typeof registerSchema>;