import { ProfileType } from "./user";

export interface RegisterFormData {
  // Step 1
  fullName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
  profileType: ProfileType;

  // Step 2
  gender: string;
  lookingFor: string;
  dateOfBirth: string;
  height: string;
  weight?: string;
  maritalStatus: string;
  religion?: string;
  caste?: string;
  motherTongue?: string;
  country: string;
  state: string;
  city: string;
  postalCode?: string;

  // Biodata & Horoscope Fields
  birthPlace?: string;
  birthTime?: string;
  gotra?: string;
  manglik?: string;
  diet?: string;

  // Step 3: Education & Occupation
  highestQualification?: string;
  college?: string;
  occupationField?: string;
  profession?: string;
  company?: string;
  annualIncome?: string;

  // Step 4: Partner Preferences
  minAge?: string;
  maxAge?: string;
  minHeight?: string;
  maxHeight?: string;
  preferredReligion?: string;
  preferredCaste?: string;
  dietPreference?: string;

  // Step 5: Family
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  brothers?: string;
  sisters?: string;
  familyType?: string;
  familyStatus?: string;

  // About & Notes
  about?: string;

  // Photos (Minimum 1, Maximum 3)
  photos?: string[];
}

export type ProfileEditFormData = Partial<RegisterFormData>;