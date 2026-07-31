export type Gender = "Male" | "Female";

export type ProfileType = "Male" | "Female";

export type UserRole =
  | "member"
  | "admin"
  | "vendor"
  | "relationship_manager";

export type AccountStatus =
  | "pending"
  | "active"
  | "blocked"
  | "deleted";

export interface User {
  id: string;

  fullName: string;

  mobile: string;

  email: string;

  password?: string;

  profileType: ProfileType;

  role: UserRole;

  accountStatus: AccountStatus;

  emailVerified: boolean;

  mobileVerified: boolean;

  createdAt: string;

  updatedAt: string;
}