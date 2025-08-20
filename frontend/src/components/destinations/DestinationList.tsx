"use client";
import { useGetAllDestinationsQuery } from "@/redux/destinationApi";
import DestinationListItem from "./DestinationListItem";
import { IDestination } from "@/types/destination.types";
import { Skeleton } from "@/components/ui/skeleton";

export default function DestinationList() {
  const { data, error, isLoading, isFetching } = useGetAllDestinationsQuery({});

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !data?.data || !data.data.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {error
            ? "Failed to load destinations. Please try again."
            : "No destinations found."}
        </p>
      </div>
    );
  }

  return (
    <div className="container m-auto space-y-4">
      {data.data.map((destination: IDestination) => (
        <DestinationListItem key={destination.id} destination={destination} />
      ))}
      {isFetching && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}
    </div>
  );
}
