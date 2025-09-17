import { UserRole } from "../user.types";

export interface IUserRegistrationInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone: string;
  profilePicture?: string;
  address?: string;
}

export interface IUserRegistrationResponseData {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}
