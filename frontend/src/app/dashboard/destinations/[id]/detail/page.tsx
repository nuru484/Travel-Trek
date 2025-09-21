// src/app/dashboard/destinations/[id]/detail/page.tsx
"use client";
import { useGetDestinationQuery } from "@/redux/destinationApi";
import DestinationDetail from "@/components/destinations/DestinationDetail";
import { useParams, useRouter } from "next/navigation";
import DetailedViewSkeleton from "@/components/DetailedViewSkeleton";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hotel } from "lucide-react";

export default function DestinationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const destinationId = parseInt(params.id, 10);

  const handleGoBack = () => {
    router.push("/dashboard/destinations");
  };

  const {
    data: destinationData,
    error,
    isError,
    isLoading,
    refetch,
  } = useGetDestinationQuery(destinationId);

  const destination = destinationData?.data;
  const errorMessage = extractApiErrorMessage(error).message;

  if (isLoading) {
    return <DetailedViewSkeleton />;
  }

  if (isError) return <ErrorMessage error={errorMessage} onRetry={refetch} />;

  if (!destination) {
    return <ErrorMessage error="Destination not found" onRetry={refetch} />;
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
              Destination Detail View
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View comprehensive Destination information details
            </p>
          </div>
        </div>

        {/* Tablet and Desktop Layout - Side by side */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Hide icon on smaller screens, show on md+ */}
            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Hotel className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Destination Detail View
              </h1>
              <p className="text-sm text-muted-foreground">
                View comprehensive Destination information details
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
            <span className="hidden sm:inline">Back to Destinations</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </div>

      <DestinationDetail destination={destination} />
    </div>
  );
}
