// src/components/flights/flight-list-item.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { RootState } from "@/redux/store";
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
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import toast from "react-hot-toast";
import { truncateText } from "@/utils/truncateText";
import Image from "next/image";
import { BookingButton } from "../bookings/BookingButton";

interface IFlightListItemProps {
  flight: IFlight;
}

export function FlightListItem({ flight }: IFlightListItemProps) {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "AGENT";
  const [deleteFlight, { isLoading: isDeleting }] = useDeleteFlightMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: destinationsData,
    isError: isDestinationsError,
    error: destinationsError,
  } = useGetAllDestinationsQuery({ limit: 100 });
  const destinations = destinationsData?.data || [];

  const {
    data: bookingsData,
    isError: isBookingsError,
    error: BookingsError,
  } = useGetAllUserBookingsQuery(
    { userId: user.id, params: { page: 1, limit: 1000 } },
    { skip: !user }
  );

  const isFlightBooked = bookingsData?.data.some(
    (booking) =>
      booking.flight?.id === flight.id &&
      booking.userId === parseInt(user?.id || "0")
  );

  useEffect(() => {
    if (isDestinationsError) {
      const { message } = extractApiErrorMessage(destinationsError);
      console.error("Failed to fetch Destinations:", destinationsError);
      toast.error(message || "Failed to load destinations");
    }
  }, [isDestinationsError, destinationsError]);

  useEffect(() => {
    if (isBookingsError) {
      const { message } = extractApiErrorMessage(BookingsError);
      console.error("Failed to fetch Bookings:", BookingsError);
      toast.error(message || "Failed to load bookings");
    }
  }, [isBookingsError, BookingsError]);

  const handleView = () => {
    router.push(`/dashboard/flights/${flight.id}/detail`);
  };

  const handleEdit = () => {
    router.push(`/dashboard/flights/${flight.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteFlight(flight.id).unwrap();
      toast.success("Flight deleted successfully");
      setShowDeleteDialog(false);
    } catch (error) {
      const { message } = extractApiErrorMessage(error);
      console.error("Failed to delete flight:", error);
      toast.error(message || "Failed to delete flight");
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
          <div className="flex flex-col md:flex-row h-full">
            {/* Flight Image */}
            <div className="relative w-full md:w-1/5 h-40 md:h-auto flex-shrink-0">
              {flight.photo ? (
                <Image
                  src={flight.photo}
                  alt={`${flight.airline} ${flight.flightNumber}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 20vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Plane className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
            </div>

            {/* Flight Information */}
            <div className="flex-1 p-4 sm:p-6 flex flex-col">
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
              <div className="flex flex-wrap justify-between text-xs text-muted-foreground mb-4 gap-2">
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
              <div className="flex gap-2 mt-auto flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleView}
                  className="flex-1 sm:flex-none sm:min-w-[80px] group-hover:border-primary/50 transition-colors cursor-pointer"
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
                      className="flex-1 sm:flex-none sm:min-w-[80px] cursor-pointer"
                      disabled={isDeleting}
                    >
                      <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Edit</span>
                      <span className="sm:hidden">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive hover:text-destructive hover:border-destructive/50 flex-1 sm:flex-none sm:min-w-[80px] cursor-pointer"
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Delete</span>
                      <span className="sm:hidden">Del</span>
                    </Button>
                    {/* Admin booking - no userId passed */}
                    <BookingButton
                      flightId={flight.id}
                      price={flight.price}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none sm:min-w-[80px] cursor-pointer"
                      disabled={isDeleting || flight.seatsAvailable <= 0}
                    />
                  </>
                ) : (
                  <>
                    {isFlightBooked ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 sm:flex-none sm:min-w-[80px] cursor-pointer"
                        disabled
                      >
                        <Bookmark className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Booked
                      </Button>
                    ) : (
                      <BookingButton
                        flightId={flight.id}
                        price={flight.price}
                        userId={parseInt(user?.id || "0")}
                        variant="default"
                        size="sm"
                        className="flex-1 sm:flex-none sm:min-w-[80px] cursor-pointer"
                        disabled={flight.seatsAvailable <= 0}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Availability Indicator */}
              <div className="px-0 sm:px-2 pt-4">
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
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Flight"
        description={`Are you sure you want to delete \"${truncateText(
          flight.flightNumber
        )}\"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive
      />
    </>
  );
}
