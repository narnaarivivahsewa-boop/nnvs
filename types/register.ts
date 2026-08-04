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

  // Step 3
  highestQualification?: string;
  college?: string;
  occupationField?: string;
  profession?: string;
  company?: string;
  annualIncome?: string;

  // Step 4
  minAge?: string;
  maxAge?: string;
  minHeight?: string;
  maxHeight?: string;
  preferredReligion?: string;
  preferredCaste?: string;

  // Step 5
  fatherName?: string;
  motherName?: string;
  brothers?: string;
  sisters?: string;
  familyType?: string;
  familyStatus?: string;

  // About
  about?: string;

  // Photos (Minimum 1, Maximum 3)
  photos?: string[];
}