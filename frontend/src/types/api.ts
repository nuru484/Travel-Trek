// src/types/api.ts
export const apiSliceTags = [
  "Customer",
  "Flight",
  "Destination",
  "Hotel",
  "Tour",
  "Booking",
  "Payment",
] as const;

export interface IApiResponse<T> {
  message: string;
  data: T;
  meta?: unknown;
}
