"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { RootState } from "@/redux/store";
import { useCreateBookingMutation } from "@/redux/bookingApi";
import { useDeleteFlightMutation } from "@/redux/flightApi";
import { useGetAllDestinationsQuery } from "@/redux/destinationApi";
import { useGetAllUserBookingsQuery } from "@/redux/bookingApi";
import { IFlight } from "@/types/flight.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Clock,
  Eye,
  Edit,
  Trash2,
  Users,
  ArrowRight,
  Route,
  Bookmark,
} from "lucide-react";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import toast from "react-hot-toast";
import { truncateText } from "@/utils/truncateText";
import Image from "next/image";

interface IFlightListItemProps {
  flight: IFlight;
}

export function FlightListItem({ flight }: IFlightListItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "AGENT";
  const [deleteFlight, { isLoading: isDeleting }] = useDeleteFlightMutation();
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);

  // Fetch destinations to get names instead of IDs
  const { data: destinationsData } = useGetAllDestinationsQuery({ limit: 100 });
  const destinations = destinationsData?.data || [];

  // Fetch user's bookings to check if this flight is already booked
  const { data: bookingsData } = useGetAllUserBookingsQuery(
    { userId: user.id, params: { page: 1, limit: 1000 } },
    { skip: !user }
  );

  const isFlightBooked = bookingsData?.data.some(
    (booking) =>
      booking.flight?.id === flight.id &&
      booking.userId === parseInt(user?.id || "0")
  );

  const handleView = () => {
    if (pathname.startsWith("/dashboard")) {
      router.push(`/dashboard/flights/${flight.id}/detail`);
    } else {
      router.push(`/dashboard/flights/${flight.id}/detail`);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/flights/${flight.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteFlight(flight.id.toString()).unwrap();
      toast.success("Flight deleted successfully");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete flight:", error);
      toast.error("Failed to delete flight");
    }
  };

  const handleBook = async () => {
    if (!user) {
      toast.error("Please log in to book a flight");
      router.push("/login");
      return;
    }

    try {
      await createBooking({
        userId: parseInt(user.id),
        flightId: flight.id,
        totalPrice: flight.price,
      }).unwrap();
      toast.success("Flight booked successfully");
      setShowBookDialog(false);
    } catch (error) {
      console.error("Failed to book flight:", error);
      toast.error("Failed to book flight");
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, HH:mm");
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDestinationName = (id: number) => {
    const destination = destinations.find((dest) => dest.id === id);
    return destination ? `${destination.city}` : `ID: ${id}`;
  };

  const getDestinationCode = (id: number) => {
    const destination = destinations.find((dest) => dest.id === id);
    if (destination?.name) {
      const words = destination.name.split(" ");
      if (words.length >= 2) {
        return words[0].substring(0, 3).toUpperCase();
      }
    }
    return destination?.city?.substring(0, 3).toUpperCase() || "N/A";
  };

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Flight Image */}
            <div className="relative w-32 h-28 sm:w-40 sm:h-32 flex-shrink-0">
              {flight.photo ? (
                <Image
                  src={flight.photo}
                  alt={`${flight.airline} ${flight.flightNumber}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 128px, 160px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Plane className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
            </div>

            {/* Flight Information */}
            <div className="flex-1 p-4 sm:p-6">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                        {flight.airline}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {flight.flightClass}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Flight {flight.flightNumber}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-lg sm:text-xl font-bold text-primary">
                      ₵{flight.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">per person</p>
                  </div>
                </div>

                {/* Route Information */}
                <div className="flex items-center justify-between mb-3 py-2 px-3 bg-muted/30 rounded-lg">
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="font-semibold text-sm">
                      {getDestinationCode(flight.originId)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getDestinationName(flight.originId)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center mx-4">
                    <div className="flex items-center gap-1">
                      <Route className="h-3 w-3 text-muted-foreground" />
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {flight.stops === 0
                        ? "Direct"
                        : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                    </p>
                  </div>

                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground">To</p>
                    <p className="font-semibold text-sm">
                      {getDestinationCode(flight.destinationId)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getDestinationName(flight.destinationId)}
                    </p>
                  </div>
                </div>

                {/* Flight Details */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="hidden sm:inline">Departure:</span>
                    <span className="font-medium">
                      {formatDate(flight.departure)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(flight.duration)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{flight.seatsAvailable} seats</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleView}
                    className="flex-1 sm:flex-none sm:min-w-[80px] group-hover:border-primary/50 transition-colors"
                  >
                    <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">View</span>
                    <span className="sm:hidden">Details</span>
                  </Button>

                  {isAdmin ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        className="flex-1 sm:flex-none sm:min-w-[80px]"
                        disabled={isDeleting || isBooking}
                      >
                        <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Edit</span>
                        <span className="sm:hidden">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive hover:text-destructive hover:border-destructive/50 flex-1 sm:flex-none sm:min-w-[80px]"
                        disabled={isDeleting || isBooking}
                      >
                        <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Delete</span>
                        <span className="sm:hidden">Del</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant={isFlightBooked ? "secondary" : "default"}
                      size="sm"
                      onClick={() => setShowBookDialog(true)}
                      className="flex-1 sm:flex-none sm:min-w-[80px]"
                      disabled={
                        isBooking ||
                        isFlightBooked ||
                        flight.seatsAvailable <= 0
                      }
                    >
                      <Bookmark className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">
                        {isFlightBooked ? "Booked" : "Book Now"}
                      </span>
                      <span className="sm:hidden">
                        {isFlightBooked ? "Booked" : "Book"}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Availability Indicator */}
          <div className="px-4 sm:px-6 pb-2">
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  flight.seatsAvailable > 50
                    ? "bg-green-500 w-full"
                    : flight.seatsAvailable > 20
                    ? "bg-yellow-500 w-3/4"
                    : "bg-red-500 w-1/4"
                }`}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {flight.seatsAvailable > 50
                ? "Great availability"
                : flight.seatsAvailable > 20
                ? "Limited seats"
                : "Few seats left"}
            </p>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Flight"
        description={`Are you sure you want to delete "${truncateText(
          flight.flightNumber
        )}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive
      />

      <ConfirmationDialog
        open={showBookDialog}
        onOpenChange={setShowBookDialog}
        title="Confirm Booking"
        description={`Are you sure you want to book flight "${truncateText(
          flight.flightNumber
        )}" from ${getDestinationName(flight.originId)} to ${getDestinationName(
          flight.destinationId
        )} for ₵${flight.price.toLocaleString()}?`}
        onConfirm={handleBook}
        confirmText="Book Now"
      />
    </>
  );
}
