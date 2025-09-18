// src/components/bookings/UserProfileBookings.tsx
"use client";
import * as React from "react";
import { BookingsDataTable } from "@/components/bookings/table/BookingsDataTable";
import { useGetAllUserBookingsQuery } from "@/redux/bookingApi";
import { Button } from "@/components/ui/button";
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
    router.push(`/bookings?userId=${userId}`);
  };

  return (
    <div className="w-full space-y-4">
      <div>
        <Button
          variant="outline"
          onClick={handleViewAllBookings}
          className="w-full sm:w-auto hover:cursor-pointer"
        >
          {totalCount > 0 ? "View All Bookings" : "View Bookings"}
        </Button>
      </div>

      {/* Data Table without extra container padding */}
      <BookingsDataTable
        data={bookings}
        loading={isLoading}
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
    </div>
  );
}
