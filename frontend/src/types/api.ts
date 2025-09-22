// src/types/api.ts
export const apiSliceTags = [
  "Customer",
  "Flight",
  "Flights",
  "Destination",
  "Hotel",
  "Hotels",
  "Tour",
  "Tours",
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
  "Rooms",
  "Room",
  "DashboardOverview",
  "ToursReport",
  "PaymentsReport",
  "BookingsReport",
] as const;

export interface IApiResponse<T> {
  message: string;
  data: T;
  meta?: unknown;
}
