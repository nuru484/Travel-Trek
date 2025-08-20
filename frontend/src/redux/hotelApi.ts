import { apiSlice } from "./apiSlice";
import {
  IHotelResponse,
  IHotelsPaginatedResponse,
  IHotelAvailabilityResponse,
} from "@/types/hotel.types";
import { IApiResponse } from "@/types/api";

export const hotelApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllHotels: builder.query<
      IHotelsPaginatedResponse,
      {
        page?: number;
        limit?: number;
        search?: string;
        destinationId?: number;
        city?: string;
        country?: string;
        starRating?: number;
        minStarRating?: number;
        maxStarRating?: number;
        amenities?: string | string[];
        sortBy?: string;
        sortOrder?: string;
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        search,
        destinationId,
        city,
        country,
        starRating,
        minStarRating,
        maxStarRating,
        amenities,
        sortBy = "createdAt",
        sortOrder = "desc",
      }) => {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
          ...(destinationId && { destinationId: destinationId.toString() }),
          ...(city && { city }),
          ...(country && { country }),
          ...(starRating && { starRating: starRating.toString() }),
          ...(minStarRating && { minStarRating: minStarRating.toString() }),
          ...(maxStarRating && { maxStarRating: maxStarRating.toString() }),
          ...(amenities && {
            amenities: Array.isArray(amenities)
              ? amenities.join(",")
              : amenities,
          }),
          sortBy,
          sortOrder,
        });

        return {
          url: `/hotels?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Hotel"],
    }),

    getHotel: builder.query<IHotelResponse, string>({
      query: (id) => ({
        url: `/hotels/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Hotel", id }],
    }),

    createHotel: builder.mutation<IApiResponse<IHotelResponse>, FormData>({
      query: (formData) => ({
        url: "/hotels",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Hotel"],
    }),

    updateHotel: builder.mutation<
      IApiResponse<IHotelResponse>,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/hotels/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Hotel", id },
        "Hotel",
      ],
    }),

    deleteHotel: builder.mutation<void, string>({
      query: (id) => ({
        url: `/hotels/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Hotel"],
    }),

    deleteAllHotels: builder.mutation<void, void>({
      query: () => ({
        url: "/hotels",
        method: "DELETE",
      }),
      invalidatesTags: ["Hotel"],
    }),

    getHotelsByDestination: builder.query<
      IHotelsPaginatedResponse,
      { destinationId: string; page?: number; limit?: number }
    >({
      query: ({ destinationId, page = 1, limit = 10 }) => ({
        url: `/hotels/destination/${destinationId}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Hotel"],
    }),

    checkHotelAvailability: builder.mutation<
      IHotelAvailabilityResponse,
      { hotelId: string; checkIn: string; checkOut: string; guests?: number }
    >({
      query: ({ hotelId, checkIn, checkOut, guests }) => ({
        url: `/hotels/${hotelId}/availability`,
        method: "POST",
        body: { checkIn, checkOut, guests },
      }),
      invalidatesTags: ["Hotel"],
    }),
  }),
});

export const {
  useGetAllHotelsQuery,
  useGetHotelQuery,
  useCreateHotelMutation,
  useUpdateHotelMutation,
  useDeleteHotelMutation,
  useDeleteAllHotelsMutation,
  useGetHotelsByDestinationQuery,
  useCheckHotelAvailabilityMutation,
} = hotelApi;
