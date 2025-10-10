// src/components/destinations/DestinationList.tsx
"use client";
import DestinationListItem from "./DestinationListItem";
import {
  IDestination,
  IDestinationQueryParams,
} from "@/types/destination.types";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search } from "lucide-react";
import ErrorMessage from "../ui/ErrorMessage";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import Pagination from "../ui/Pagination";
import { DestinationFilters } from "./DestinationFilters";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

interface DestinationListProps {
  data: IDestination[];
  isLoading: boolean;
  isError: boolean;
  error: FetchBaseQueryError | SerializedError | undefined;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: Omit<IDestinationQueryParams, "page" | "limit">;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onFiltersChange: (
    filters: Partial<Omit<IDestinationQueryParams, "page" | "limit">>
  ) => void;
  onRefetch: () => void;
  countries: string[];
  cities: string[];
}

export default function DestinationList({
  data,
  isLoading,
  isError,
  error,
  meta,
  filters,
  onPageChange,
  onLimitChange,
  onFiltersChange,
  onRefetch,
  countries,
  cities,
}: DestinationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Filters Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
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
    return <ErrorMessage error={errorMessage} onRetry={onRefetch} />;
  }

  const destinationCount = data?.length || 0;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <DestinationFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        countries={countries}
        cities={cities}
      />

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center hidden sm:flex">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              Available Destinations
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {meta.total} destination{meta.total !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
      </div>

      {/* Destination List */}
      {destinationCount > 0 ? (
        <>
          <div className="space-y-4">
            {data.map((destination: IDestination) => (
              <DestinationListItem
                key={destination.id}
                destination={destination}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            meta={meta}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
            showPageSizeSelector={true}
            pageSizeOptions={[10, 25, 50]}
          />
        </>
      ) : (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Destinations Found
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              No destinations match your search criteria. Try adjusting your
              filters.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
