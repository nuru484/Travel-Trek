// src/components/tours/tour-list.tsx
"use client";
import { useGetAllToursQuery } from "@/redux/tourApi";
import { TourListItem } from "./tour-list-item";
import { ITour } from "@/types/tour.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle, Search } from "lucide-react";

export function TourList() {
  const { data, error, isLoading, isFetching } = useGetAllToursQuery({});

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>

        {/* Tour List Skeletons */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to Load Tours
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            We couldn&apos;t load the tour information. Please check your
            connection and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!data?.data || !data.data.length) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Tours Found
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            There are currently no tours available. Please check back later or
            adjust your search criteria.
          </p>
        </div>
      </div>
    );
  }

  const tourCount = data.data.length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center hidden sm:flex">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              Available Tours
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Choose from our selection of tours
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="font-medium text-xs sm:text-sm w-fit"
        >
          {tourCount} tour{tourCount !== 1 ? "s" : ""} found
        </Badge>
      </div>

      {/* Tour List */}
      <div className="space-y-4">
        {data.data.map((tour: ITour) => (
          <TourListItem key={tour.id} tour={tour} />
        ))}

        {/* Loading indicator for additional tours */}
        {isFetching && (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton
                key={`loading-${i}`}
                className="h-36 w-full rounded-lg"
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {tourCount > 0 && (
        <div className="text-center pt-4 border-t border-border/40">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing all {tourCount} available tour
            {tourCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
