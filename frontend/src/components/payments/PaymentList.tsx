// src/components/payments/PaymentList.tsx
"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetAllPaymentsQuery } from "@/redux/paymentApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Receipt } from "lucide-react";
import { IPaymentResponse } from "@/types/payment.types";
import PaymentListItem from "./PaymentListItem";

export function PaymentList() {
  const user = useSelector((state: RootState) => state.auth.user);
  const {
    data: paymentsData,
    isLoading,
    isError,
  } = useGetAllPaymentsQuery({ page: 1, limit: 100 }, { skip: !user });

  const payments: IPaymentResponse[] = paymentsData?.data ?? [];

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please log in to view your payment history.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            Failed to load payment history. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No payment history found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {payments.map((payment) => (
          <PaymentListItem key={payment.id} payment={payment} />
        ))}
      </CardContent>
    </Card>
  );
}
