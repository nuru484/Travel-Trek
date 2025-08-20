// src/types/user.ts

// Enum
export enum UserRole {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER",
  AGENT = "AGENT",
}

export interface IUserProfile {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  profilePicture?: File | null;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: string | number | boolean | Date | File | null | undefined;
}

export interface IUserResponse {
  message: string;
  data: IUserProfile;
}
