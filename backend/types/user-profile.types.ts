// Enum
export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  AGENT = 'AGENT',
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  profilePicture?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

// Interfaces for type safety
export interface IUserRegistrationInput {
  email: string;
  password: string;
  name: string;
  role: UserRole; // Enum for user roles
  phone: string;
  profilePicture?: string;
  address?: string;
}

export interface IUserResponseData {
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

/**
 * Interface for user profile update input data (before middleware processing)
 */
export interface IUserUpdateInput {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  profilePicture?: string | Express.Multer.File; // Supports Base64 string or Multer file object
}

/**
 * Interface for user profile update data (after middleware processing)
 * This is what gets passed to Prisma
 */
export interface IUserUpdateData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  profilePicture?: string; // Only string after middleware processing
}

// Interfaces for responses
export interface IUsersPaginatedResponse {
  message: string;
  data: IUserResponseData[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
