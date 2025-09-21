export interface IRoomInput {
  hotelId: number;
  roomType: string;
  price: number;
  capacity: number;
  description?: string;
  amenities?: string[];
  roomPhoto?: string | Express.Multer.File;
  available?: boolean;
}

export interface IRoomUpdateInput extends Partial<IRoomInput> {
  id: number;
}

export interface IRoomHotel {
  id: number;
  name: string;
  description: string | null;
}

export interface IRoom {
  id: number;
  roomType: string;
  price: number;
  capacity: number;
  description: string | null;
  amenities: string[];
  photo: string | null;
  available: boolean;
  hotel: IRoomHotel | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoomResponse {
  message: string;
  data: IRoom;
}

export interface IRoomsPaginatedResponse {
  message: string;
  data: IRoom[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IRoomQueryParams {
  page?: number;
  limit?: number;
  hotelId?: number;
  roomType?: string;
  available?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
  maxCapacity?: number;
  amenities?: string | string[];
  sortBy?: string | 'createdAt';
  sortOrder?: string | 'desc';
}
