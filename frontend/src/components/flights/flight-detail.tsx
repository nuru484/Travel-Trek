// src/components/flights/flight-detail.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { RootState } from "@/redux/store";
import { useDeleteFlightMutation } from "@/redux/flightApi";
import {
  useGetAllUserBookingsQuery,
  useCreateBookingMutation,
  useDeleteBookingMutation,
} from "@/redux/bookingApi";
import { useGetAllDestinationsQuery } from "@/redux/destinationApi";
import { IFlight } from "@/types/flight.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Users,
  Route,
  Bookmark,
  MoreHorizontal,
  Plane,
  CreditCard,
} from "lucide-react";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import toast from "react-hot-toast";
import Image from "next/image";

interface IFlightDetailProps {
  flight: IFlight;
}

export function FlightDetail({ flight }: IFlightDetailProps) {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN";
  const [deleteFlight, { isLoading: isDeleting }] = useDeleteFlightMutation();
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();
  const [deleteBooking, { isLoading: isUnbooking }] =
    useDeleteBookingMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showUnbookDialog, setShowUnbookDialog] = useState(false);

  const {
    data: destinationsData,
    isError: isDestinationsError,
    error: destinationsError,
  } = useGetAllDestinationsQuery({ limit: 100 });
  const destinations = destinationsData?.data || [];

  const { data: bookingsData } = useGetAllUserBookingsQuery(
    { userId: user.id, params: { page: 1, limit: 1000 } },
    { skip: !user }
  );

  const userBooking = bookingsData?.data.find(
    (booking) =>
      booking.flight?.id === flight.id &&
      booking.userId === parseInt(user?.id || "0")
  );

  const isFlightBooked = !!userBooking;

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "EEEE, MMMM dd, yyyy HH:mm");
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDestinationName = (id: number) => {
    const destination = destinations.find((dest) => dest.id === id);
    return destination
      ? `${destination.name} (${destination.city}, ${destination.country})`
      : `Destination ID: ${id}`;
  };

  useEffect(() => {
    if (isDestinationsError) {
      const { message } = extractApiErrorMessage(destinationsError);
      console.error("Failed to fetch Destinations:", destinationsError);
      toast.error(message || "Failed to load destinations");
    }
  }, [isDestinationsError, destinationsError]);

  const handleEdit = () => {
    router.push(`/dashboard/flights/${flight.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteFlight(flight.id).unwrap();
      toast.success("Flight deleted successfully");
      setShowDeleteDialog(false);
      router.push("/dashboard/flights");
    } catch (error) {
      const { message } = extractApiErrorMessage(error);
      console.error("Failed to delete flight:", error);
      toast.error(message || "Failed to delete flight");
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
      const { message } = extractApiErrorMessage(error);
      console.error("Failed to book flight:", error);
      toast.error(message || "Failed to book flight");
    }
  };

  const handleUnbook = async () => {
    if (!userBooking) return;

    try {
      await deleteBooking(userBooking.id).unwrap();
      toast.success("Booking cancelled successfully");
      setShowUnbookDialog(false);
    } catch (error) {
      const { message } = extractApiErrorMessage(error);
      console.error("Failed to cancel booking:", error);
      toast.error(message || "Failed to cancel booking");
    }
  };

  const truncatedFlightNumber =
    flight.flightNumber.length > 50
      ? `${flight.flightNumber.slice(0, 47)}...`
      : flight.flightNumber;

  const isLoading = isDeleting || isBooking || isUnbooking;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Hero Section with Flight Image */}
        <Card className="overflow-hidden shadow-sm">
          {flight.photo && (
            <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96">
              <Image
                src={flight.photo}
                alt={`${flight.airline} ${flight.flightNumber}`}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* Actions Dropdown */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-2">
                {!isAdmin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isFlightBooked ? "secondary" : "default"}
                        size="sm"
                        onClick={() =>
                          isFlightBooked
                            ? setShowUnbookDialog(true)
                            : setShowBookDialog(true)
                        }
                        disabled={
                          isLoading ||
                          (!isFlightBooked && flight.seatsAvailable <= 0)
                        }
                        className="bg-white/90 hover:bg-white text-black shadow-sm cursor-pointer"
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">
                          {isFlightBooked ? "Unbook" : "Book"}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isFlightBooked ? "Cancel booking" : "Book this flight"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-black shadow-sm cursor-pointer"
                        disabled={isLoading}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={handleEdit}
                        disabled={isLoading}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Flight
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isLoading}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Flight
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Hero Content */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-white/90 text-black"
                    >
                      {flight.flightClass}
                    </Badge>
                    {isFlightBooked && (
                      <Badge
                        variant="outline"
                        className="text-white border-white/90 bg-white/10"
                      >
                        {userBooking?.status}
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white line-clamp-2">
                    {flight.airline}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-white/90">
                    Flight {flight.flightNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content when no image */}
          {!flight.photo && (
            <div className="p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{flight.flightClass}</Badge>
                    {isFlightBooked && (
                      <Badge variant="outline">{userBooking?.status}</Badge>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                    {flight.airline}
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Flight {flight.flightNumber}
                  </p>
                </div>

                {/* Actions for no image state */}
                <div className="flex gap-2">
                  {!isAdmin && (
                    <Button
                      variant={isFlightBooked ? "secondary" : "default"}
                      size="sm"
                      onClick={() =>
                        isFlightBooked
                          ? setShowUnbookDialog(true)
                          : setShowBookDialog(true)
                      }
                      disabled={
                        isLoading ||
                        (!isFlightBooked && flight.seatsAvailable <= 0)
                      }
                      className="cursor-pointer"
                    >
                      <Bookmark className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">
                        {isFlightBooked ? "Unbook" : "Book"}
                      </span>
                    </Button>
                  )}

                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          disabled={isLoading}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={handleEdit}
                          disabled={isLoading}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Flight
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(true)}
                          disabled={isLoading}
                          className="text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Flight
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Flight Details - Horizontal Layout */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Origin */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground mb-2">Origin</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {getDestinationName(flight.originId)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destination */}
          <Card className="border-l-4 border-l-secondary">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-secondary-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground mb-2">
                    Destination
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {getDestinationName(flight.destinationId)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-accent-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-3">
                  <p className="font-semibold text-foreground mb-2">Schedule</p>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      Departure
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(flight.departure), "MMM dd, HH:mm")}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      Arrival
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(flight.arrival), "MMM dd, HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Details */}
          <Card className="border-l-4 border-l-muted">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground mb-2">
                    Price & Details
                  </p>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-primary">
                      ₵{flight.price.toLocaleString()}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="font-medium text-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(flight.duration)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground flex items-center gap-1">
                          <Route className="h-3 w-3" />
                          {flight.stops === 0
                            ? "Direct"
                            : `${flight.stops} stop${
                                flight.stops > 1 ? "s" : ""
                              }`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expanded Schedule & Availability Section */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Detailed Schedule */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Plane className="h-5 w-5" />
                Flight Schedule
              </h3>
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="font-medium text-foreground mb-1">Departure</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(flight.departure)}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="font-medium text-foreground mb-1">Arrival</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(flight.arrival)}
                  </p>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Flight Duration:
                  </span>
                  <span className="font-medium">
                    {formatDuration(flight.duration)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Users className="h-5 w-5" />
                Availability
              </h3>
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        Seats Available
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {flight.seatsAvailable > 0
                          ? `${flight.seatsAvailable} of ${flight.capacity} seats remaining`
                          : "Fully Booked"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        flight.seatsAvailable === 0
                          ? "destructive"
                          : flight.seatsAvailable > 20
                          ? "default"
                          : flight.seatsAvailable > 5
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {flight.seatsAvailable === 0
                        ? "Unavailable"
                        : flight.seatsAvailable > 20
                        ? "Available"
                        : flight.seatsAvailable > 5
                        ? "Limited"
                        : "Few Left"}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Class:</span>
                    <p className="font-medium">{flight.flightClass}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stops:</span>
                    <p className="font-medium">
                      {flight.stops === 0
                        ? "Direct"
                        : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Capacity:</span>
                    <p className="font-medium">{flight.capacity} seats</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confirmation Dialogs */}
        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Flight"
          description={`Are you sure you want to delete flight "${truncatedFlightNumber}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          confirmText="Delete"
          isDestructive
        />

        <ConfirmationDialog
          open={showBookDialog}
          onOpenChange={setShowBookDialog}
          title="Confirm Booking"
          description={`Are you sure you want to book flight "${truncatedFlightNumber}" from ${getDestinationName(
            flight.originId
          )} to ${getDestinationName(
            flight.destinationId
          )} for ₵${flight.price.toLocaleString()}?`}
          onConfirm={handleBook}
          confirmText="Book Now"
        />

        <ConfirmationDialog
          open={showUnbookDialog}
          onOpenChange={setShowUnbookDialog}
          title="Cancel Booking"
          description={`Are you sure you want to cancel your booking for flight "${truncatedFlightNumber}"?`}
          onConfirm={handleUnbook}
          confirmText="Cancel Booking"
          isDestructive
        />
      </div>
    </TooltipProvider>
  );
}
