// src/redux/dashboardApi.ts
import { apiSlice } from "./apiSlice";
import { IDashboardResponse } from "@/types/dashboard.types";

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<IDashboardResponse, void>({
      query: () => ({
        url: "/dashboard",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
