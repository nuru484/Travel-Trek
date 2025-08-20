"use client";
import { useGetAllHotelsQuery } from "@/redux/hotelApi";
import { HotelListItem } from "./hotel-list-item";
import { IHotel } from "@/types/hotel.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Home, AlertCircle, Search } from "lucide-react";

export function HotelList() {
  const { data, error, isLoading, isFetching } = useGetAllHotelsQuery({});

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>

        {/* Hotel List Skeletons */}
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
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to Load Hotels
          </h3>
          <p className="text-muted-foreground mb-4">
            We couldn&apos;t load the hotel information. Please check your
            connection and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!data?.data || !data.data.length) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Hotels Found
          </h3>
          <p className="text-muted-foreground mb-4">
            There are currently no hotels available. Please check back later or
            adjust your search criteria.
          </p>
        </div>
      </div>
    );
  }

  const hotelCount = data.data.length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Home className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Available Hotels
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose from our selection of hotels
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="font-medium">
          {hotelCount} hotel{hotelCount !== 1 ? "s" : ""} found
        </Badge>
      </div>

      {/* Hotel List */}
      <div className="space-y-4">
        {data.data.map((hotel: IHotel) => (
          <HotelListItem key={hotel.id} hotel={hotel} />
        ))}

        {/* Loading indicator for additional hotels */}
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
      {hotelCount > 0 && (
        <div className="text-center pt-4 border-t border-border/40">
          <p className="text-sm text-muted-foreground">
            Showing all {hotelCount} available hotel
            {hotelCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
