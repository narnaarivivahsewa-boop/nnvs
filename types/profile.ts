export type MaritalStatus =
  | "Never Married"
  | "Divorced"
  | "Widowed"
  | "Awaiting Divorce";

export type Diet =
  | "Vegetarian"
  | "Eggetarian"
  | "Non Vegetarian"
  | "Vegan";

export type ProfileVisibility =
  | "public"
  | "members"
  | "premium"
  | "hidden";

export interface Profile {
  id: string;

  userId: string;

  profileId: string;

  firstName: string;
  lastName: string;

  gender: "Male" | "Female";

  dateOfBirth: string;

  age: number;

  height: string;

  weight?: number;

  religion: string;

  caste: string;

  subCaste?: string;

  motherTongue: string;

  education: string;

  occupation: string;

  annualIncome: string;

  city: string;

  state: string;

  country: string;

  profilePhoto?: string;

  aboutMe?: string;

  maritalStatus: MaritalStatus;

  diet: Diet;

  manglik: boolean;

  profileVisibility: ProfileVisibility;

  isFeatured: boolean;

  isVerified: boolean;

  isPremium: boolean;

  createdAt: string;

  updatedAt: string;
}