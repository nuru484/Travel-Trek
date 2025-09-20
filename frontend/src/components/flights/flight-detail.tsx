// src/components/flights/flight-detail.tsx
"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  ArrowLeft,
  Users,
  Route,
  Bookmark,
} from "lucide-react";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import toast from "react-hot-toast";
import Image from "next/image";

interface IFlightDetailProps {
  flight: IFlight;
}

export function FlightDetail({ flight }: IFlightDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN";
  const [deleteFlight, { isLoading: isDeleting }] = useDeleteFlightMutation();
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();
  const [deleteBooking, { isLoading: isUnbooking }] =
    useDeleteBookingMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showUnbookDialog, setShowUnbookDialog] = useState(false);

  const { data: destinationsData } = useGetAllDestinationsQuery({ limit: 100 });
  const destinations = destinationsData?.data || [];

  const { data: bookingsData } = useGetAllUserBookingsQuery(
    { userId: user.id, params: { page: 1, limit: 1000 } },
    { skip: !user }
  );

  const userBooking = bookingsData?.data.find(
    (booking) =>
      booking.flight.id === flight.id &&
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

  const handleEdit = () => {
    router.push(`/admin-dashboard/flights/${flight.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteFlight(flight.id.toString()).unwrap();
      toast.success("Flight deleted successfully");
      setShowDeleteDialog(false);
      router.push(
        pathname.startsWith("/admin-dashboard")
          ? "/admin-dashboard/flights"
          : "/dashboard/flights"
      );
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

  const handleUnbook = async () => {
    if (!userBooking) return;

    try {
      await deleteBooking(userBooking.id).unwrap();
      toast.success("Booking cancelled successfully");
      setShowUnbookDialog(false);
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  const truncatedFlightNumber =
    flight.flightNumber.length > 50
      ? `${flight.flightNumber.slice(0, 47)}...`
      : flight.flightNumber;

  const backRoute = pathname.startsWith("/admin-dashboard")
    ? "/admin-dashboard/flights"
    : "/dashboard/flights";

  const showEditDeleteButtons = isAdmin && !pathname.startsWith("/dashboard");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(backRoute)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2 ml-auto">
          {showEditDeleteButtons && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                disabled={isDeleting || isBooking || isUnbooking}
                className="min-w-[100px]"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting || isBooking || isUnbooking}
                className="text-destructive hover:text-destructive min-w-[100px]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
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
                isBooking ||
                isUnbooking ||
                (!isFlightBooked && flight.seatsAvailable <= 0)
              }
              className="min-w-[100px]"
            >
              <Bookmark className="mr-2 h-4 w-4" />
              {isFlightBooked ? "Unbook" : "Book Now"}
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden shadow-sm">
        {flight.photo && (
          <div className="relative w-full h-64 md:h-80 lg:h-96">
            <Image
              src={flight.photo}
              alt={`${flight.airline} ${flight.flightNumber}`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="space-y-2">
                <Badge variant="secondary" className="bg-white/90 text-black">
                  {flight.flightClass}
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {flight.airline}
                </h1>
                <p className="text-lg text-white/90">
                  Flight {flight.flightNumber}
                </p>
                {isFlightBooked && (
                  <Badge
                    variant="outline"
                    className="text-white border-white/90"
                  >
                    Booking Status: {userBooking?.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        <CardHeader className={flight.photo ? "pb-4" : "pb-6"}>
          {!flight.photo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{flight.flightClass}</Badge>
                {isFlightBooked && (
                  <Badge variant="outline">
                    Booking Status: {userBooking?.status}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {flight.airline}
              </h1>
              <p className="text-lg text-muted-foreground">
                Flight {flight.flightNumber}
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Route Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">Origin</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {getDestinationName(flight.originId)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-secondary-foreground mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">
                      Destination
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {getDestinationName(flight.destinationId)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flight Schedule */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </h3>

              <div className="space-y-4 pl-7">
                <div>
                  <p className="font-medium text-foreground">Departure</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(flight.departure)}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-foreground">Arrival</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(flight.arrival)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span> ₵</span>
                Pricing & Details
              </h3>

              <div className="space-y-4 pl-7">
                <div>
                  <p className="font-medium text-foreground">Price</p>
                  <p className="text-2xl font-bold text-primary">
                    ₵{flight.price.toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      Duration
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(flight.duration)}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-foreground text-sm">Stops</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Route className="h-4 w-4" />
                      {flight.stops === 0
                        ? "Direct"
                        : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-foreground">
                    Seats Available
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {flight.seatsAvailable} seats remaining
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge
                    variant={
                      flight.seatsAvailable > 20
                        ? "default"
                        : flight.seatsAvailable > 5
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {flight.seatsAvailable > 20
                      ? "Available"
                      : flight.seatsAvailable > 5
                      ? "Limited"
                      : "Few Left"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

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
  );
}
