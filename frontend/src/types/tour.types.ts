export enum TourType {
  ADVENTURE = "ADVENTURE",
  CULTURAL = "CULTURAL",
  BEACH = "BEACH",
  CITY = "CITY",
  WILDLIFE = "WILDLIFE",
  CRUISE = "CRUISE",
}

export enum TourStatus {
  UPCOMING = "UPCOMING",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface ITour {
  id: number;
  name: string;
  description: string | null;
  type: TourType;
  status: TourStatus;
  duration: number;
  price: number;
  maxGuests: number;
  guestsBooked: number;
  startDate: string;
  endDate: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITourResponse {
  message: string;
  data: ITour;
}

// Add query params interface
export interface IToursQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: TourType;
  status?: TourStatus;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}

export interface IToursPaginatedResponse {
  message: string;
  data: ITour[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ITourInput {
  name: string;
  description?: string | null;
  type: TourType;
  duration: number;
  price: number;
  maxGuests: number;
  startDate: string;
  endDate: string;
  location: string;
}

export interface IUpdateTourInput extends Partial<ITourInput> {
  id: string;
}
