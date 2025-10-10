import { apiSlice } from "./apiSlice";
import {
  ITourResponse,
  IToursPaginatedResponse,
  IToursQueryParams,
} from "../types/tour.types";
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
    getAllTours: builder.query<IToursPaginatedResponse, IToursQueryParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });

        return {
          url: `/tours${
            searchParams.toString() ? `?${searchParams.toString()}` : ""
          }`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Tour" as const, id })),
              "Tours",
            ]
          : ["Tours"],
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
