"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useDeleteBookingMutation } from "@/redux/bookingApi";
import { useGetAllFlightsQuery } from "@/redux/flightApi";
import { useGetAllHotelsQuery } from "@/redux/hotelApi";
import { useGetAllToursQuery } from "@/redux/tourApi";
import { useGetAllDestinationsQuery } from "@/redux/destinationApi";
import { IBooking } from "@/types/booking.types";
import { IFlight } from "@/types/flight.types";
import { IHotel } from "@/types/hotel.types";
import { ITour } from "@/types/tour.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, MapPin, DollarSign } from "lucide-react";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import toast from "react-hot-toast";
import { truncateText } from "@/utils/truncateText";
import { PaymentButton } from "@/components/payments/PaymentButton";

// Type guards
function isFlight(item: IFlight | IHotel | ITour): item is IFlight {
  return "airline" in item;
}

function isHotel(item: IFlight | IHotel | ITour): item is IHotel {
  return "starRating" in item;
}

function isTour(item: IFlight | IHotel | ITour): item is ITour {
  return "location" in item;
}

interface IBookingListItemProps {
  booking: IBooking;
}

export function BookingListItem({ booking }: IBookingListItemProps) {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "AGENT";
  const [deleteBooking, { isLoading: isUnbooking }] =
    useDeleteBookingMutation();
  const [showUnbookDialog, setShowUnbookDialog] = useState(false);

  // Fetch flights, hotels, and tours to get details
  const { data: flightsData } = useGetAllFlightsQuery({ page: 1, limit: 100 });
  const { data: hotelsData } = useGetAllHotelsQuery({ page: 1, limit: 100 });
  const { data: toursData } = useGetAllToursQuery({ page: 1, limit: 100 });
  const { data: destinationsData } = useGetAllDestinationsQuery({ limit: 100 });

  const flights = flightsData?.data || [];
  const hotels = hotelsData?.data || [];
  const tours = toursData?.data || [];
  const destinations = destinationsData?.data || [];

  // Determine the booked item type and details
  let bookedItem: IFlight | IHotel | ITour | undefined;
  if (booking.flightId) {
    bookedItem = flights.find((f) => f.id === booking.flightId);
  } else if (booking.hotelId) {
    bookedItem = hotels.find((h) => h.id === booking.hotelId);
  } else if (booking.tourId) {
    bookedItem = tours.find((t) => t.id === booking.tourId);
  }

  const itemType = booking.flightId
    ? "Flight"
    : booking.hotelId
    ? "Hotel"
    : "Tour";

  const itemName = bookedItem
    ? isFlight(bookedItem)
      ? `${bookedItem.airline} ${bookedItem.flightNumber}`
      : bookedItem.name
    : `Unknown ${itemType}`;

  const getDestinationName = (id: number) => {
    const destination = destinations.find((dest) => dest.id === id);
    return destination
      ? `${destination.city}, ${destination.country}`
      : `ID: ${id}`;
  };

  const getLocation = () => {
    if (!bookedItem) return "Unknown Location";

    if (isFlight(bookedItem)) {
      return `${getDestinationName(
        bookedItem.originId
      )} to ${getDestinationName(bookedItem.destinationId)}`;
    }
    if (isHotel(bookedItem)) {
      return getDestinationName(bookedItem.destinationId);
    }
    if (isTour(bookedItem)) {
      return bookedItem.location;
    }

    return "Unknown Location";
  };

  const handleViewDetails = () => {
    if (booking.flightId) {
      router.push(`/dashboard/flights/${booking.flightId}/detail`);
    } else if (booking.hotelId) {
      router.push(`/dashboard/hotels/${booking.hotelId}/detail`);
    } else if (booking.tourId) {
      router.push(`/dashboard/tours/${booking.tourId}/detail`);
    }
  };

  const handleUnbook = async () => {
    try {
      await deleteBooking(booking.id.toString()).unwrap();
      toast.success("Booking cancelled successfully");
      setShowUnbookDialog(false);
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "default";
      case "confirmed":
        return "secondary";
      case "cancelled":
        return "destructive";
      case "completed":
        return "outline";
      default:
        return "default";
    }
  };

  const isPendingBooking = booking.status === "PENDING";

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group border border-border/50 hover:border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                    {truncateText(itemName, 30)}
                  </h3>
                  <Badge
                    variant={getStatusColor(booking.status)}
                    className="text-xs"
                  >
                    {booking.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {itemType} Booking
                </p>
              </div>
              <div className="ml-4 text-right">
                <div className="flex items-center gap-1 text-primary font-semibold text-sm sm:text-base">
                  <DollarSign className="h-4 w-4" />
                  <span>₵{booking.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="flex items-center justify-between mb-3 py-2 px-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium text-sm truncate">
                    {getLocation()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Booked On</p>
                <p className="font-medium text-sm">
                  {formatDate(booking.createdAt)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                className="flex-1 sm:flex-none sm:min-w-[100px] group-hover:border-primary/50 transition-colors"
                disabled={isUnbooking}
              >
                <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">View Details</span>
                <span className="sm:hidden">Details</span>
              </Button>

              {/* Payment Button for PENDING bookings */}
              {!isAdmin && isPendingBooking && (
                <PaymentButton
                  bookingId={booking.id}
                  amount={booking.totalPrice}
                  currency="₵"
                  size="sm"
                  className="flex-1 sm:flex-none sm:min-w-[100px]"
                />
              )}

              {!isAdmin && !isPendingBooking && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnbookDialog(true)}
                  className="flex-1 sm:flex-none sm:min-w-[100px] text-destructive hover:text-destructive hover:border-destructive/50"
                  disabled={isUnbooking}
                >
                  <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Unbook</span>
                  <span className="sm:hidden">Cancel</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showUnbookDialog}
        onOpenChange={setShowUnbookDialog}
        title="Cancel Booking"
        description={`Are you sure you want to cancel your booking for ${itemType.toLowerCase()} "${truncateText(
          itemName,
          30
        )}"?`}
        onConfirm={handleUnbook}
        confirmText="Cancel Booking"
        isDestructive
      />
    </>
  );
}
