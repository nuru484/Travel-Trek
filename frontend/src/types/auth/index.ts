import { UserRole } from "../user.types";
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
