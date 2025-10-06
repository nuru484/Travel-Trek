// src/components/destinations/DestinationList.tsx
"use client";
import { useGetAllDestinationsQuery } from "@/redux/destinationApi";
import DestinationListItem from "./DestinationListItem";
import { IDestination } from "@/types/destination.types";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search } from "lucide-react";
import ErrorMessage from "../ui/ErrorMessage";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";

export default function DestinationList() {
  const { data, isError, error, isLoading, isFetching, refetch } =
    useGetAllDestinationsQuery({});

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>

        {/* Destination List Skeletons */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMessage = extractApiErrorMessage(error).message;
    return <ErrorMessage error={errorMessage} onRetry={refetch} />;
  }

  if (!data?.data || !data.data.length) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Destinations Found
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            There are currently no destinations available. Please check back
            later or adjust your search criteria.
          </p>
        </div>
      </div>
    );
  }

  const destinationCount = data.data.length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center hidden sm:flex">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              Available Destinations
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Explore our range of destinations
            </p>
          </div>
        </div>
      </div>

      {/* Destination List */}
      <div className="space-y-4">
        {data.data.map((destination: IDestination) => (
          <DestinationListItem key={destination.id} destination={destination} />
        ))}

        {/* Loading indicator for additional destinations */}
        {isFetching && (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton
                key={`loading-${i}`}
                className="h-20 w-full rounded-lg"
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {destinationCount > 0 && (
        <div className="text-center pt-4 border-t border-border/40">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing all {destinationCount} available destination
            {destinationCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
