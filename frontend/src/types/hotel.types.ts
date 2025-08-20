export interface IHotel {
  id: number;
  name: string;
  description: string | null;
  address: string;
  city: string;
  country: string;
  phone: string | null;
  starRating: number;
  amenities: string[];
  photo: string | null;
  destinationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface IHotelResponse {
  message: string;
  data: IHotel;
}

export interface IHotelsPaginatedResponse {
  message: string;
  data: IHotel[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters?: {
      search?: string;
      destinationId?: number;
      city?: string;
      country?: string;
      starRating?: number;
      minStarRating?: number;
      maxStarRating?: number;
      amenities?: string | string[];
      sortBy?: string;
      sortOrder?: string;
    };
  };
}

export interface IHotelInput {
  name: string;
  description?: string | null;
  address: string;
  city: string;
  country: string;
  phone?: string | null;
  starRating?: number;
  amenities?: string[];
  destinationId: number;
  hotelPhoto?: string | File;
}

export interface IUpdateHotelInput extends Partial<IHotelInput> {
  id: string;
}

export interface IHotelAvailabilityResponse {
  message: string;
  data: {
    hotel: {
      id: number;
      name: string;
      address: string;
      city: string;
      country: string;
      starRating: number;
      amenities: string[];
      photo: string | null;
    };
    availableRooms: {
      id: number;
      roomType: string;
      price: number;
      capacity: number;
      description: string | null;
      amenities: string[];
      photo: string | null;
    }[];
    searchCriteria: {
      checkIn: string;
      checkOut: string;
      guests?: number;
    };
  };
}
