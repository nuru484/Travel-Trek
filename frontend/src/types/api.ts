// src/types/api.ts
export const apiSliceTags = [
  "Customer",
  "Flight",
  "Destination",
  "Hotel",
  "Tour",
  "Booking",
  "Bookings",
  "UserBooking",
  "UserBookings",
  "Payment",
  "Payments",
  "UserPayment",
  "UserPayments",
  "User",
  "Users",
  "Dashboard",
] as const;

export interface IApiResponse<T> {
  message: string;
  data: T;
  meta?: unknown;
}
