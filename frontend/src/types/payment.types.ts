// src/types/payment.types.ts
export interface IPaymentInput {
  bookingId: number;
  paymentMethod:
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "MOBILE_MONEY"
    | "BANK_TRANSFER";
}

export interface IPaymentResponse {
  id: number;
  bookingId: number;
  userId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  transactionReference: string;
  paymentDate: Date | null;
  createdAt: string;
  updatedAt: string;
}

export interface IPaymentsPaginatedResponse {
  message: string;
  data: IPaymentResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IPaymentInitializeResponse {
  authorization_url: string;
  paymentId: number;
  transactionReference: string;
}

export interface IPaymentVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    amount: number;
    reference: string;
    paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
    bookingId: number;
  };
}

export type PaymentMethod = "CREDIT_CARD" | "DEBIT_CARD" | "MOBILE_MONEY";
