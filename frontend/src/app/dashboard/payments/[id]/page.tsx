// src/app/dashboard/payments/[id]/page.tsx
"use client";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useParams, useRouter } from "next/navigation";
import { useGetPaymentQuery } from "@/redux/paymentApi";
import PaymentDetailView from "@/components/payments/PaymentDetailView";
import PaymentDetailViewSkeleton from "@/components/payments/PaymentDetailViewSkeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt } from "lucide-react";

const PaymentDetailPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const paymentId = parseInt(params.id, 10);

  const {
    data: paymentData,
    error,
    isError,
    isLoading,
    refetch,
  } = useGetPaymentQuery(paymentId);

  const payment = paymentData?.data;
  const errorMessage = extractApiErrorMessage(error).message;

  const handleGoBack = () => {
    router.push("/dashboard/payments");
  };

  if (isLoading) return <PaymentDetailViewSkeleton />;

  if (isError) return <ErrorMessage error={errorMessage} onRetry={refetch} />;

  if (!payment) {
    return <ErrorMessage error="Payment not found" onRetry={refetch} />;
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Responsive Page Header */}
      <div className="border-b border-border pb-4 sm:pb-6">
        {/* Mobile Layout - Stacked */}
        <div className="flex flex-col space-y-3 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2 self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Payment Detail View
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View payment information and transaction details
            </p>
          </div>
        </div>

        {/* Tablet and Desktop Layout - Side by side */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Hide icon on smaller screens, show on md+ */}
            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Payment Detail View
              </h1>
              <p className="text-sm text-muted-foreground">
                View comprehensive payment information and transaction details
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2 shrink-0 ml-4 hover:cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Payments</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </div>

      {/* Payment Detail Component */}
      <PaymentDetailView payment={payment} />
    </div>
  );
};

export default PaymentDetailPage;
