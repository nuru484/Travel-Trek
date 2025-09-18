// src/types/booking.types.ts

export interface IBookingUser {
  id: number;
  name: string;
  email: string;
}

export interface IBookingTour {
  id: number;
  name: string;
  description: string | null;
}

export interface IBookingHotel {
  id: number;
  name: string;
  description: string | null;
}

export interface IBookingRoom {
  id: number;
  roomType: string;
  description: string | null;
}

export interface IBookingFlight {
  id: number;
  flightNumber: string;
  airline: string;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface IBookingPayment {
  id: number;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentMethod:
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "MOBILE_MONEY"
    | "BANK_TRANSFER";
}

export interface IBookingBase {
  id: number;
  userId: number;
  user: IBookingUser;
  payment: IBookingPayment | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  totalPrice: number;
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
}

// Discriminated union based on `type`
export interface ITourBooking extends IBookingBase {
  type: "TOUR";
  tour: IBookingTour;
  hotel: null;
  room: null;
  flight: null;
}

export interface IHotelBooking extends IBookingBase {
  type: "HOTEL";
  hotel: IBookingHotel;
  room: IBookingRoom;
  tour: null;
  flight: null;
}

export interface IFlightBooking extends IBookingBase {
  type: "FLIGHT";
  flight: IBookingFlight;
  tour: null;
  hotel: null;
  room: null;
}

export type IBooking = ITourBooking | IHotelBooking | IFlightBooking;

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

export type IUpdateBookingInput = Partial<IBookingInput>;

export interface IDeleteBookingsResponse {
  message: string;
  deletedCount: number;
}

export interface IBookingsQueryParams {
  page?: number;
  limit?: number;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  search?: string;
}

export interface IBookingsDataTableProps {
  data: IBooking[];
  loading?: boolean;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  filters: Omit<IBookingsQueryParams, "page" | "limit">;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onFiltersChange: (
    filters: Partial<Omit<IBookingsQueryParams, "page" | "limit">>
  ) => void;
  onRefresh?: () => void;
  showCustomer?: boolean;
}
