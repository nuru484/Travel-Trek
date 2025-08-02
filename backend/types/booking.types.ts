export interface IBookingInput {
  userId: number;
  tourId?: number | null;
  hotelId?: number | null;
  roomId?: number | null;
  flightId?: number | null;
  totalPrice: number;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

export interface IBookingResponse {
  id: number;
  userId: number;
  tourId: number | null;
  hotelId: number | null;
  roomId: number | null;
  flightId: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalPrice: number;
  bookingDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
