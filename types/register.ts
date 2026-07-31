import { ProfileType } from "./user";

export interface RegisterFormData {
  fullName: string;

  mobile: string;

  email: string;

  password: string;

  confirmPassword: string;

  profileType: ProfileType;
}