// src/app/dashboard/payments/callback/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaymentCallbackQuery } from "@/redux/paymentApi";
import toast from "react-hot-toast";

type PaymentStatus = "loading" | "success" | "failed" | "error";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>("loading");

  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const {
    data: result,
    error,
    isLoading,
    refetch,
  } = usePaymentCallbackQuery(reference || "", {
    skip: !reference,
  });

  console.log(result);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      toast.error("No payment reference found");
      return;
    }

    if (result?.success) {
      setStatus("success");
      toast.success("Payment verified successfully!");
    } else if (error) {
      setStatus("error");
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Payment verification failed");
    } else if (result && !result.success) {
      setStatus("failed");
      toast.error("Payment verification failed");
    }
  }, [result, error, reference]);

  const handleContinue = () => {
    if (status === "success") {
      router.push(`/dashboard/bookings`);
    }
  };

  const handleRetry = () => {
    if (reference) {
      setStatus("loading");
      refetch();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 text-center">
          {(status === "loading" || isLoading) && (
            <>
              <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
              <p className="text-gray-600">
                Please wait while we verify your payment with Paystack...
              </p>
            </>
          )}

          {status === "success" && result?.data && (
            <>
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2 text-green-700">
                Payment Successful!
              </h2>
              <div className="space-y-2 mb-6">
                <p className="text-gray-600">
                  Your booking has been confirmed successfully.
                </p>
                <div className="bg-green-50 p-3 rounded-lg text-sm">
                  <p>
                    <strong>Amount:</strong> GHS{" "}
                    {result.data.amount?.toLocaleString()}
                  </p>
                  <p>
                    <strong>Reference:</strong> {result.data.reference}
                  </p>
                  <p>
                    <strong>Status:</strong> {result.data.paymentStatus}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  You&apos;ll receive a confirmation email shortly.
                </p>
              </div>
              <Button onClick={handleContinue} className="w-full">
                View Booking Details
              </Button>
            </>
          )}

          {/* Similar updates for failed and error states */}
          {status === "failed" && (
            <>
              <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2 text-red-700">
                Payment Failed
              </h2>
              <div className="space-y-2 mb-6">
                <p className="text-gray-600">
                  Unfortunately, your payment could not be processed.
                </p>
                {result?.data && (
                  <div className="bg-red-50 p-3 rounded-lg text-sm">
                    <p>
                      <strong>Reference:</strong> {result.data.reference}
                    </p>
                    <p>
                      <strong>Status:</strong> {result.data.paymentStatus}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="w-full"
                >
                  Retry Verification
                </Button>
                <Button
                  onClick={handleContinue}
                  variant="secondary"
                  className="w-full"
                >
                  Back to Bookings
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-orange-500" />
              <h2 className="text-xl font-semibold mb-2 text-orange-700">
                Verification Error
              </h2>
              <p className="text-gray-600 mb-6">
                There was an error verifying your payment. This doesn&apos;t
                necessarily mean your payment failed.
              </p>
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
                <Button
                  onClick={handleContinue}
                  variant="outline"
                  className="w-full"
                >
                  Check My Bookings
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
