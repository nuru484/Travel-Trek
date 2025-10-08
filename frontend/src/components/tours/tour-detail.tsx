// src/components/tours/tour-detail.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { RootState } from "@/redux/store";
import { useDeleteTourMutation } from "@/redux/tourApi";
import {
  useGetAllUserBookingsQuery,
  useCreateBookingMutation,
  useDeleteBookingMutation,
} from "@/redux/bookingApi";
import { ITour } from "@/types/tour.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Users,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import toast from "react-hot-toast";

interface ITourDetailProps {
  tour: ITour;
}

export function TourDetail({ tour }: ITourDetailProps) {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const [deleteTour, { isLoading: isDeleting }] = useDeleteTourMutation();
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();
  const [deleteBooking, { isLoading: isUnbooking }] =
    useDeleteBookingMutation();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showUnbookDialog, setShowUnbookDialog] = useState(false);

  const { data: bookingsData } = useGetAllUserBookingsQuery(
    { userId: user.id, params: { page: 1, limit: 1000 } },
    { skip: !user }
  );

  const userBooking = bookingsData?.data.find(
    (booking) =>
      booking.tour?.id === tour.id &&
      booking.userId === parseInt(user?.id || "0")
  );
  const isTourBooked = !!userBooking;
  const isFullyBooked = tour.guestsBooked >= tour.maxGuests;

  const formatDate = (date: string | Date) =>
    format(new Date(date), "EEEE, MMMM dd, yyyy HH:mm");

  const formatDuration = (days: number) => `${days} day${days > 1 ? "s" : ""}`;

  const handleEdit = () => {
    router.push(`/dashboard/tours/${tour.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteTour(tour.id).unwrap();
      toast.success("Tour deleted successfully");
      setShowDeleteDialog(false);
      router.push("/dashboard/tours");
    } catch (error) {
      const { message } = extractApiErrorMessage(error);
      console.error("Failed to delete tour:", error);
      toast.error(message || "Failed to delete tour");
    }
  };

  const handleBook = async () => {
    try {
      await createBooking({
        userId: parseInt(user.id),
        tourId: tour.id,
        totalPrice: tour.price,
      }).unwrap();
      toast.success("Tour booked successfully");
      setShowBookDialog(false);
    } catch (error) {
      const { message } = extractApiErrorMessage(error);
      console.error("Failed to book tour:", error);
      toast.error(message || "Failed to book tour");
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

  const truncatedTourName =
    tour.name.length > 50 ? `${tour.name.slice(0, 47)}...` : tour.name;

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-6 relative">
          {/* Actions */}
          <div className="absolute top-3 right-3">
            {isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/90 hover:bg-white text-black shadow-sm cursor-pointer"
                    disabled={isDeleting}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={handleEdit}
                    disabled={isDeleting}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Tour
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Tour
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant={isTourBooked ? "secondary" : "default"}
                size="sm"
                onClick={() =>
                  isTourBooked
                    ? setShowUnbookDialog(true)
                    : setShowBookDialog(true)
                }
                disabled={
                  isBooking || isUnbooking || (isFullyBooked && !isTourBooked)
                }
                className="cursor-pointer"
              >
                <Bookmark className="mr-2 h-4 w-4" />
                {isTourBooked
                  ? "Unbook"
                  : isFullyBooked
                  ? "Fully Booked"
                  : "Book Now"}
              </Button>
            )}
          </div>

          {/* Tour Info */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{tour.type}</Badge>
              <Badge
                variant={
                  tour.status === "UPCOMING"
                    ? "default"
                    : tour.status === "ONGOING"
                    ? "secondary"
                    : tour.status === "COMPLETED"
                    ? "outline"
                    : "destructive"
                }
              >
                {tour.status}
              </Badge>
              {isFullyBooked && (
                <Badge variant="destructive">Fully Booked</Badge>
              )}
              {isTourBooked && (
                <Badge variant="outline">
                  Booking Status: {userBooking?.status}
                </Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
              {tour.name}
            </h1>
            {tour.description && (
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                {tour.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Section */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Location */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground mb-2">Location</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tour.location}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="border-l-4 border-l-secondary">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-secondary mt-1" />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="font-semibold text-foreground">Schedule</p>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Start Date
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(tour.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    End Date
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(tour.endDate)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Details */}
        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground">Price</p>
                <p className="text-2xl font-bold text-primary">
                  ₵{tour.price.toLocaleString()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Duration
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(tour.duration)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Availability
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {tour.guestsBooked} / {tour.maxGuests}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Tour"
        description={`Are you sure you want to delete tour "${truncatedTourName}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive
      />

      <ConfirmationDialog
        open={showBookDialog}
        onOpenChange={setShowBookDialog}
        title="Confirm Booking"
        description={`Are you sure you want to book tour "${truncatedTourName}" in ${
          tour.location
        } for ₵${tour.price.toLocaleString()}?`}
        onConfirm={handleBook}
        confirmText="Book Now"
      />

      <ConfirmationDialog
        open={showUnbookDialog}
        onOpenChange={setShowUnbookDialog}
        title="Cancel Booking"
        description={`Are you sure you want to cancel your booking for tour "${truncatedTourName}"?`}
        onConfirm={handleUnbook}
        confirmText="Cancel Booking"
        isDestructive
      />
    </div>
  );
}
