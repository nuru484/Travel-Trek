// src/redux/bookingApi.ts
import { apiSlice } from "./apiSlice";
import {
  IBookingResponse,
  IBookingsPaginatedResponse,
  IBookingInput,
} from "@/types/booking.types";
import { IApiResponse } from "@/types/api";

export const bookingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllBookings: builder.query<
      IBookingsPaginatedResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => ({
        url: `/bookings?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Booking"],
    }),

    getBooking: builder.query<IBookingResponse, string>({
      query: (id) => ({
        url: `/bookings/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Booking", id }],
    }),

    createBooking: builder.mutation<
      IApiResponse<IBookingResponse>,
      IBookingInput
    >({
      query: (bookingData) => ({
        url: "/bookings",
        method: "POST",
        body: bookingData,
      }),
      invalidatesTags: ["Booking"],
    }),

    updateBooking: builder.mutation<
      IApiResponse<IBookingResponse>,
      { id: string; bookingData: Partial<IBookingInput> }
    >({
      query: ({ id, bookingData }) => ({
        url: `/bookings/${id}`,
        method: "PUT",
        body: bookingData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Booking", id },
        "Booking",
      ],
    }),

    deleteBooking: builder.mutation<void, string>({
      query: (id) => ({
        url: `/bookings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Booking"],
    }),

    deleteAllBookings: builder.mutation<void, void>({
      query: () => ({
        url: "/bookings",
        method: "DELETE",
      }),
      invalidatesTags: ["Booking"],
    }),
  }),
});

export const {
  useGetAllBookingsQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
  useDeleteAllBookingsMutation,
} = bookingApi;
