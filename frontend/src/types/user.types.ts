// src/types/user.ts

// Enum
export enum UserRole {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER",
  AGENT = "AGENT",
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  profilePicture: string | null;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUserResponse {
  message: string;
  data: IUser;
}

export interface IUsersPaginatedResponse {
  message: string;
  data: IUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}


export interface IUserUpdateInput {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
}


export interface IChangeRoleInput {
  role: UserRole;
}

export interface IDeleteAllUsersInput {
  confirmDelete: string;
}

export interface IUsersQueryParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

export interface IDeleteUsersResponse {
  message: string;
  deletedCount: number;
}

export interface IUsersDataTableProps {
  data: IUser[];
  loading?: boolean;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  filters: Omit<IUsersQueryParams, "page" | "limit">;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onFiltersChange: (
    filters: Partial<Omit<IUsersQueryParams, "page" | "limit">>
  ) => void;
  onRefresh?: () => void;
}
