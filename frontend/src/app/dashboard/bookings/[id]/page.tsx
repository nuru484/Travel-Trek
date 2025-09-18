// src/app/dashboard/bookings/[id]/page.tsx
"use client";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useParams, useRouter } from "next/navigation";
import { useGetBookingQuery } from "@/redux/bookingApi";
import BookingDetailView from "@/components/bookings/BookingDetailView";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import BookingDetailViewSkeleton from "@/components/bookings/BookingDetailViewSkeleton";

const BookingDetailPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bookingId = parseInt(params.id, 10);

  const {
    data: bookingData,
    error,
    isError,
    isLoading,
    refetch,
  } = useGetBookingQuery({
    bookingId,
  });

  const booking = bookingData?.data;
  const errorMessage = extractApiErrorMessage(error).message;

  const handleGoBack = () => {
    router.push("/dashboard/bookings");
  };

  if (isLoading) return <BookingDetailViewSkeleton />;

  if (isError) return <ErrorMessage error={errorMessage} onRetry={refetch} />;

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
              Booking Detail View
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View booking information and customer details
            </p>
          </div>
        </div>

        {/* Tablet and Desktop Layout - Side by side */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Hide icon on smaller screens, show on md+ */}
            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Booking Detail View
              </h1>
              <p className="text-sm text-muted-foreground">
                View comprehensive booking information and customer details
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
            <span className="hidden sm:inline">Back to Bookings</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </div>

      {/* Booking Detail Component */}
      <BookingDetailView booking={booking} />
    </div>
  );
};

export default BookingDetailPage;
