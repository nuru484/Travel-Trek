export interface IRoomInput {
  hotelId: number;
  roomType: string;
  price: number;
  capacity: number;
  description?: string;
  roomPhoto?: string | Express.Multer.File;
  available?: boolean;
}

export interface IRoomResponse {
  id: number;
  hotelId: number;
  roomType: string;
  price: number;
  capacity: number;
  description: string | null;
  photo: string | null;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoomsPaginatedResponse {
  message: string;
  data: IRoomResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
