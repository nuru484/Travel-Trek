// src/redux/destinationApi.ts
import { apiSlice } from "./apiSlice";
import {
  IDestinationApiResponse,
  IDestinationsPaginatedResponse,
} from "../types/destination.types";
import { IApiResponse } from "@/types/api";

export const destinationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllDestinations: builder.query<
      IDestinationsPaginatedResponse,
      {
        page?: number;
        limit?: number;
        search?: string;
        country?: string;
        city?: string;
        sortBy?: string;
        sortOrder?: string;
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        search,
        country,
        city,
        sortBy,
        sortOrder,
      }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
          ...(country && { country }),
          ...(city && { city }),
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
        });
        return {
          url: `/destinations?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Destination"],
    }),

    getDestination: builder.query<IDestinationApiResponse, string>({
      query: (id) => ({
        url: `/destinations/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Destination", id }],
    }),

    createDestination: builder.mutation<IDestinationApiResponse, FormData>({
      query: (formData) => ({
        url: "/destinations",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Destination"],
    }),

    updateDestination: builder.mutation<
      IDestinationApiResponse,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/destinations/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Destination", id },
        "Destination",
      ],
    }),

    deleteDestination: builder.mutation<IApiResponse<null>, string>({
      query: (id) => ({
        url: `/destinations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Destination"],
    }),

    deleteAllDestinations: builder.mutation<IApiResponse<null>, void>({
      query: () => ({
        url: "/destinations",
        method: "DELETE",
      }),
      invalidatesTags: ["Destination"],
    }),
  }),
});

export const {
  useGetAllDestinationsQuery,
  useGetDestinationQuery,
  useCreateDestinationMutation,
  useUpdateDestinationMutation,
  useDeleteDestinationMutation,
  useDeleteAllDestinationsMutation,
} = destinationApi;
