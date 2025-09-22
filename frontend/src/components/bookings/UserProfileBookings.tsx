// src/components/bookings/UserProfileBookings.tsx
"use client";
import * as React from "react";
import { BookingsDataTable } from "@/components/bookings/table/BookingsDataTable";
import { useGetAllUserBookingsQuery } from "@/redux/bookingApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface UserProfileBookingsProps {
  userId: number;
}

export function UserProfileBookings({ userId }: UserProfileBookingsProps) {
  const router = useRouter();

  const {
    data: bookingsData,
    isLoading,
    refetch,
  } = useGetAllUserBookingsQuery({
    userId,
    params: {
      limit: 5,
      page: 1,
    },
  });

  const bookings = bookingsData?.data || [];
  const totalCount = bookingsData?.meta.total || 0;

  const handleViewAllBookings = () => {
    router.push(`/dashboard/bookings?userId=${userId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-24 sm:w-auto" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <BookingsDataTable
            data={[]}
            loading={true}
            totalCount={0}
            page={1}
            pageSize={5}
            filters={{}}
            onFiltersChange={() => {}}
            onRefresh={refetch}
            showFilters={false}
            showActions={true}
            showPagination={false}
            showSelection={false}
            showCustomer={false}
            isRecentsView={true}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg sm:text-xl">
              Recent Bookings
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {totalCount > 0
                ? `Showing latest ${Math.min(
                    5,
                    totalCount
                  )} of ${totalCount} bookings`
                : "No bookings found"}
            </p>
          </div>
          {totalCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAllBookings}
              className="w-full sm:w-auto hover:cursor-pointer"
            >
              View All ({totalCount})
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <BookingsDataTable
          data={bookings}
          loading={false}
          totalCount={totalCount}
          page={1}
          pageSize={5}
          filters={{}}
          onFiltersChange={() => {}}
          onRefresh={refetch}
          showFilters={false}
          showActions={true}
          showPagination={false}
          showSelection={false}
          showCustomer={false}
          isRecentsView={true}
        />
      </CardContent>
    </Card>
  );
}
