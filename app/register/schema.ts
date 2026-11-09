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
    gender: z.string().min(1, "Please select gender"),
    lookingFor: z.string().min(1, "Please select preference"),
    dateOfBirth: z.string().min(1, "Date of Birth is required"),
    height: z.string().min(1, "Please select height"),
    weight: z.string().optional(),
    maritalStatus: z.string().min(1, "Please select marital status"),
    religion: z.string().optional(),
    caste: z.string().min(1, "Caste / Community is required"),
    motherTongue: z.string().optional(),
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    city: z.string().trim().min(1, "City, town, or village is required"),
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
      .array(
        z
          .string()
          .refine(
            (val) =>
              val.startsWith("https://") ||
              val.startsWith("http://") ||
              val.startsWith("/uploads/") ||
              val.startsWith("data:image/"),
            "Invalid photo URL"
          )
      )
      .min(1, "At least 1 photo is mandatory to create/update profile")
      .max(3, "Maximum 3 photos allowed"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type RegisterSchema = z.infer<typeof registerSchema>;