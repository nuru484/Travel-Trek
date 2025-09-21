// src/app/dashboard/flights/[id]/detail/page.tsx
"use client";
import { useGetFlightQuery } from "@/redux/flightApi";
import { FlightDetail } from "@/components/flights/flight-detail";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plane } from "lucide-react";
import { FlightDetailSkeleton } from "@/components/flights/flight-detail-skeleton";

export default function FlightDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const flightId = parseInt(params.id, 10);

  const handleGoBack = () => {
    router.push("/dashboard/flights");
  };

  const {
    data: flightData,
    error,
    isError,
    isLoading,
    refetch,
  } = useGetFlightQuery(flightId);

  const hotel = flightData?.data;
  const errorMessage = extractApiErrorMessage(error).message;

  if (isLoading) return <FlightDetailSkeleton />;

  if (isError) return <ErrorMessage error={errorMessage} onRetry={refetch} />;

  if (!hotel) {
    return <ErrorMessage error="Flight not found" onRetry={refetch} />;
  }

  return (
    <div className="container mx-auto space-y-10">
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
              Flight Detail View
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View Flight information details
            </p>
          </div>
        </div>

        {/* Tablet and Desktop Layout - Side by side */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Hide icon on smaller screens, show on md+ */}
            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Plane className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Flight Detail View
              </h1>
              <p className="text-sm text-muted-foreground">
                View comprehensive Flight information details
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
            <span className="hidden sm:inline">Back to Flights</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </div>

      <FlightDetail flight={hotel} />
    </div>
  );
}
