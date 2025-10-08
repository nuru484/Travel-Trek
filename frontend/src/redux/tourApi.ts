import { apiSlice } from "./apiSlice";
import { ITourResponse, IToursPaginatedResponse } from "../types/tour.types";
import { IApiResponse } from "@/types/api";

// Type for the tour creation/update payload
export interface ITourPayload {
  name: string;
  description?: string | null;
  type: "ADVENTURE" | "CULTURAL" | "BEACH" | "CITY" | "WILDLIFE" | "CRUISE";
  price: number;
  maxGuests: number;
  startDate: string;
  endDate: string;
  location: string;
}

export const tourApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllTours: builder.query<
      IToursPaginatedResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => ({
        url: `/tours?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Tour"],
    }),

    getTour: builder.query<ITourResponse, number>({
      query: (id) => ({
        url: `/tours/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Tour", id }],
    }),

    createTour: builder.mutation<IApiResponse<ITourResponse>, ITourPayload>({
      query: (tourData) => ({
        url: "/tours",
        method: "POST",
        body: tourData,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["Tour"],
    }),

    updateTour: builder.mutation<
      IApiResponse<ITourResponse>,
      { id: number; tourData: ITourPayload }
    >({
      query: ({ id, tourData }) => ({
        url: `/tours/${id}`,
        method: "PUT",
        body: tourData,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Tour", id },
        "Tour",
      ],
    }),

    deleteTour: builder.mutation<void, number>({
      query: (id) => ({
        url: `/tours/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tour"],
    }),

    deleteAllTours: builder.mutation<void, void>({
      query: () => ({
        url: "/tours",
        method: "DELETE",
      }),
      invalidatesTags: ["Tour"],
    }),
  }),
});

export const {
  useGetAllToursQuery,
  useGetTourQuery,
  useCreateTourMutation,
  useUpdateTourMutation,
  useDeleteTourMutation,
  useDeleteAllToursMutation,
} = tourApi;
