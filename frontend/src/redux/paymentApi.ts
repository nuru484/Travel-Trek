// src/redux/paymentApi.ts
import { apiSlice } from "./apiSlice";
import {
  IPaymentResponse,
  IPaymentsPaginatedResponse,
  IPaymentInput,
  IPaymentInitializeResponse,
  IPaymentVerificationResponse,
} from "../types/payment.types";

import { IApiResponse } from "@/types/api";

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all payments (paginated)
     */
    getAllPayments: builder.query<
      IPaymentsPaginatedResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => ({
        url: `/payments?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Payment"],
    }),

    /**
     * Get a single payment by ID
     */
    getPayment: builder.query<IApiResponse<IPaymentResponse>, string>({
      query: (id) => ({
        url: `/payments/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Payment", id }],
    }),

    /**
     * Create/initiate a payment (Paystack initialization)
     */
    createPayment: builder.mutation<
      IApiResponse<IPaymentInitializeResponse>,
      IPaymentInput
    >({
      query: (paymentData) => ({
        url: "/payments",
        method: "POST",
        body: paymentData,
      }),
      invalidatesTags: ["Payment", "Booking"],
    }),
    paymentCallback: builder.query<IPaymentVerificationResponse, string>({
      query: (reference) => ({
        url: `/payments/callback?reference=${reference}`,
        method: "GET",
      }),
      providesTags: ["Payment"],
    }),
  }),
});

export const {
  useGetAllPaymentsQuery,
  useGetPaymentQuery,
  useCreatePaymentMutation,
  usePaymentCallbackQuery,
} = paymentApi;
