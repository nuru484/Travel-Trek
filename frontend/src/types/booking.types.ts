// src/types/booking.types.ts

export interface IBooking {
  id: number;
  userId: number;
  tourId: number | null;
  hotelId: number | null;
  roomId: number | null;
  flightId: number | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  totalPrice: number;
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBookingResponse {
  message: string;
  data: IBooking;
}

export interface IBookingsPaginatedResponse {
  message: string;
  data: IBooking[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IBookingInput {
  userId: number;
  tourId?: number | null;
  hotelId?: number | null;
  roomId?: number | null;
  flightId?: number | null;
  totalPrice: number;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
}

export interface IUpdateBookingInput extends Partial<IBookingInput> {
  id: string;
}
