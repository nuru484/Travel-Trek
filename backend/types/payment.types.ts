export interface IPaymentInput {
  bookingId: number;
  paymentMethod:
    | 'MOBILE_MONEY'
    | 'DEBIT_CARD'
    | 'CREDIT_CARD'
    | 'BANK_TRANSFER';
}

export interface IPaymentResponse {
  id: number;
  bookingId: number;
  userId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionReference: string;
  paymentDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
