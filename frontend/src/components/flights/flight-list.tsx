"use client";
import { useGetAllFlightsQuery } from "@/redux/flightApi";
import { FlightListItem } from "./flight-list-item";
import { IFlight } from "@/types/flight.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plane, Search } from "lucide-react";
import ErrorMessage from "../ui/ErrorMessage";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";

export function FlightList() {
  const { data, isError, error, isLoading, refetch } = useGetAllFlightsQuery(
    {}
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>

        {/* Flight List Skeletons */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
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
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Flights Found
          </h3>
          <p className="text-muted-foreground mb-4">
            There are currently no flights available. Please check back later or
            adjust your search criteria.
          </p>
        </div>
      </div>
    );
  }

  const flightCount = data.data.length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plane className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Available Flights
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose from our selection of flights
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="font-medium">
          {flightCount} flight{flightCount !== 1 ? "s" : ""} found
        </Badge>
      </div>

      {/* Flight List */}
      <div className="space-y-4">
        {data.data.map((flight: IFlight) => (
          <FlightListItem key={flight.id} flight={flight} />
        ))}
      </div>

      {/* Footer Info */}
      {flightCount > 0 && (
        <div className="text-center pt-4 border-t border-border/40">
          <p className="text-sm text-muted-foreground">
            Showing all {flightCount} available flight
            {flightCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
