export interface IHotelInput {
  name: string;
  description?: string | null;
  address: string;
  city: string;
  country: string;
  phone?: string | null;
  starRating?: number;
  amenities: string[];
  destinationId: number;
  hotelPhoto?: string | Express.Multer.File;
}

export interface IHotelUpdateInput {
  name?: string;
  description?: string | null;
  address?: string;
  city?: string;
  country?: string;
  phone?: string | null;
  starRating?: number;
  amenities?: string[];
  destinationId?: number;
  hotelPhoto?: string | Express.Multer.File;
}

export interface IHotelResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IHotelsPaginatedResponse {
  message: string;
  data: IHotelResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
