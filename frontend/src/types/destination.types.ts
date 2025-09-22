// types/destination.types.ts

// Main destination interface - matches backend IDestinationResponse exactly
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

// For API responses that return a single destination
export interface IDestinationApiResponse {
  message: string;
  data: IDestination;
}

// For paginated API responses
export interface IDestinationsPaginatedResponse {
  message: string;
  data: IDestination[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters: {
      search?: string;
      country?: string;
      city?: string;
      sortBy?: string;
      sortOrder?: string;
    };
  };
}

// For form inputs when creating/updating destinations
export interface IDestinationInput {
  name: string;
  description?: string;
  country: string;
  city?: string;
  destinationPhoto?: File; // Frontend uses File object for uploads
}

export interface IDestinationUpdateInput {
  name?: string;
  description?: string;
  country?: string;
  city?: string;
  destinationPhoto?: File; 
}
