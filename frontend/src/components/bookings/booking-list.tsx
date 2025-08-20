"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetAllBookingsQuery } from "@/redux/bookingApi";
import { BookingListItem } from "./booking-list-item";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function BookingList() {
  const user = useSelector((state: RootState) => state.auth.user);
  const {
    data: bookingsData,
    isLoading,
    isError,
  } = useGetAllBookingsQuery({ page: 1, limit: 100 }, { skip: !user });

  const bookings = bookingsData?.data || [];

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please log in to view your bookings.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            Failed to load bookings. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            You have no bookings yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-foreground">My Bookings</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookings.map((booking) => (
            <BookingListItem key={booking.id} booking={booking} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
