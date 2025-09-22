// src/redux/reportsApi.ts
import { apiSlice } from "./apiSlice";
import {
  IMonthlyBookingsResponse,
  IPaymentsSummaryResponse,
  ITopToursResponse,
  IReportsQueryParams,
} from "@/types/reports.types";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get monthly bookings summary
    getMonthlyBookingsSummary: builder.query<
      IMonthlyBookingsResponse,
      IReportsQueryParams
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (Array.isArray(value)) {
              searchParams.append(key, value.join(","));
            } else {
              searchParams.append(key, String(value));
            }
          }
        });

        const queryString = searchParams.toString();
        return {
          url: `/reports/bookings/monthly-summary${
            queryString ? `?${queryString}` : ""
          }`,
          method: "GET",
        };
      },
      providesTags: ["BookingsReport"],
    }),

    // Get payments summary
    getPaymentsSummary: builder.query<
      IPaymentsSummaryResponse,
      IReportsQueryParams
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (Array.isArray(value)) {
              searchParams.append(key, value.join(","));
            } else {
              searchParams.append(key, String(value));
            }
          }
        });

        const queryString = searchParams.toString();
        return {
          url: `/reports/payments/summary${
            queryString ? `?${queryString}` : ""
          }`,
          method: "GET",
        };
      },
      providesTags: ["PaymentsReport"],
    }),

    // Get top tours by bookings
    getTopToursByBookings: builder.query<
      ITopToursResponse,
      IReportsQueryParams
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (Array.isArray(value)) {
              searchParams.append(key, value.join(","));
            } else {
              searchParams.append(key, String(value));
            }
          }
        });

        const queryString = searchParams.toString();
        return {
          url: `/reports/tours/top-by-bookings${
            queryString ? `?${queryString}` : ""
          }`,
          method: "GET",
        };
      },
      providesTags: ["ToursReport"],
    }),

    getDashboardOverview: builder.query<
      {
        bookings: IMonthlyBookingsResponse;
        payments: IPaymentsSummaryResponse;
        tours: ITopToursResponse;
      },
      Omit<IReportsQueryParams, "limit" | "minBookings">
    >({
      async queryFn(
        params = {},
        { dispatch }
      ): Promise<
        | {
            data: {
              bookings: IMonthlyBookingsResponse;
              payments: IPaymentsSummaryResponse;
              tours: ITopToursResponse;
            };
          }
        | { error: FetchBaseQueryError }
      > {
        try {
          const [bookingsResult, paymentsResult, toursResult] =
            await Promise.all([
              dispatch(
                reportsApi.endpoints.getMonthlyBookingsSummary.initiate(params)
              ),
              dispatch(
                reportsApi.endpoints.getPaymentsSummary.initiate(params)
              ),
              dispatch(
                reportsApi.endpoints.getTopToursByBookings.initiate({
                  ...params,
                  limit: 5,
                })
              ),
            ]);

          if (
            bookingsResult.error ||
            paymentsResult.error ||
            toursResult.error
          ) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Failed to fetch dashboard data",
              },
            };
          }

          return {
            data: {
              bookings: bookingsResult.data!,
              payments: paymentsResult.data!,
              tours: toursResult.data!,
            },
          };
        } catch (err) {
          return {
            error: { status: "FETCH_ERROR", error: String(err) },
          };
        }
      },
      providesTags: ["DashboardOverview"],
    }),
  }),
});

export const {
  useGetMonthlyBookingsSummaryQuery,
  useGetPaymentsSummaryQuery,
  useGetTopToursByBookingsQuery,
  useGetDashboardOverviewQuery,

  // Lazy hooks
  useLazyGetMonthlyBookingsSummaryQuery,
  useLazyGetPaymentsSummaryQuery,
  useLazyGetTopToursByBookingsQuery,
  useLazyGetDashboardOverviewQuery,
} = reportsApi;
