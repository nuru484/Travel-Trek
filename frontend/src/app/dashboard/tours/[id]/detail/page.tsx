// src/app/dashboard/tours/[id]/detail/page.tsx
"use client";
import { useParams, useRouter } from "next/navigation";
import { useGetTourQuery } from "@/redux/tourApi";
import { TourDetail } from "@/components/tours/tour-detail";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map } from "lucide-react";
import { TourDetailSkeleton } from "@/components/tours/tour-detail-skeleton";

export default function TourDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tourId = parseInt(params.id, 10);

  const {
    data: tourData,
    error,
    isError,
    isLoading,
    refetch,
  } = useGetTourQuery(tourId);

  const tour = tourData?.data;
  const errorMessage = extractApiErrorMessage(error).message;

  const handleGoBack = () => {
    router.push("/dashboard/tours");
  };

  if (isLoading) return <TourDetailSkeleton />;

  if (isError) return <ErrorMessage error={errorMessage} onRetry={refetch} />;

  if (!tour) {
    return <ErrorMessage error="Tour not found" onRetry={refetch} />;
  }

  return (
    <div className="container mx-auto space-y-10">
      <div className="border-b border-border pb-4 sm:pb-6">
        {/* Mobile Layout */}
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
              Tour Detail View
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View Tour information details
            </p>
          </div>
        </div>

        {/* Tablet & Desktop Layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Map className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Tour Detail View
              </h1>
              <p className="text-sm text-muted-foreground">
                View comprehensive tour information details
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
            <span className="hidden sm:inline">Back to Tours</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </div>

      <TourDetail tour={tour} />
    </div>
  );
}
