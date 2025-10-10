// types/destination.types.ts
export interface IDestination {
  id: number;
  name: string;
  description: string | null;
  country: string;
  city: string | null;
  photo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDestinationApiResponse {
  message: string;
  data: IDestination;
}

export interface IDestinationsPaginatedResponse {
  message: string;
  data: IDestination[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Query parameters for filtering and pagination
export interface IDestinationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  city?: string;
  sortBy?: string | "createdAt";
  sortOrder?: string | "desc";
}

export interface IDestinationInput {
  name: string;
  description?: string;
  country: string;
  city?: string;
  destinationPhoto?: File;
}

export interface IDestinationUpdateInput {
  name?: string;
  description?: string;
  country?: string;
  city?: string;
  destinationPhoto?: File;
}
