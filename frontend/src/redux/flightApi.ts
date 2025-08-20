// src/redux/flightApi.ts
import { apiSlice } from "./apiSlice";
import {
  IFlightResponse,
  IFlightsPaginatedResponse,
} from "@/types/flight.types";
import { IApiResponse } from "@/types/api";

export const flightApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllFlights: builder.query<
      IFlightsPaginatedResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => ({
        url: `/flights?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Flight"],
    }),

    getFlight: builder.query<IFlightResponse, string>({
      query: (id) => ({
        url: `/flights/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Flight", id }],
    }),

    createFlight: builder.mutation<IApiResponse<IFlightResponse>, FormData>({
      query: (formData) => ({
        url: "/flights",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Flight"],
    }),

    updateFlight: builder.mutation<
      IApiResponse<IFlightResponse>,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/flights/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Flight", id },
        "Flight",
      ],
    }),

    deleteFlight: builder.mutation<void, string>({
      query: (id) => ({
        url: `/flights/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Flight"],
    }),

    deleteAllFlights: builder.mutation<void, void>({
      query: () => ({
        url: "/flights",
        method: "DELETE",
      }),
      invalidatesTags: ["Flight"],
    }),
  }),
});

export const {
  useGetAllFlightsQuery,
  useGetFlightQuery,
  useCreateFlightMutation,
  useUpdateFlightMutation,
  useDeleteFlightMutation,
  useDeleteAllFlightsMutation,
} = flightApi;
