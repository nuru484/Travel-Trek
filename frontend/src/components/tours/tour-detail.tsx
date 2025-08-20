"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { RootState } from "@/redux/store";
import { useDeleteTourMutation } from "@/redux/tourApi";
import {
  useGetAllBookingsQuery,
  useCreateBookingMutation,
  useDeleteBookingMutation,
} from "@/redux/bookingApi";
import { ITour } from "@/types/tour.types";
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
  Bookmark,
} from "lucide-react";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import toast from "react-hot-toast";

interface ITourDetailProps {
  tour: ITour;
}

export function TourDetail({ tour }: ITourDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN";
  const [deleteTour, { isLoading: isDeleting }] = useDeleteTourMutation();
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();
  const [deleteBooking, { isLoading: isUnbooking }] =
    useDeleteBookingMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showUnbookDialog, setShowUnbookDialog] = useState(false);

  // Fetch user's bookings to check if this tour is booked and its status
  const { data: bookingsData } = useGetAllBookingsQuery(
    { page: 1, limit: 100 },
    { skip: !user }
  );
  const userBooking = bookingsData?.data.find(
    (booking) =>
      booking.tourId === tour.id && booking.userId === parseInt(user?.id || "0")
  );
  const isTourBooked = !!userBooking;

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "EEEE, MMMM dd, yyyy HH:mm");
  };

  const formatDuration = (days: number) => {
    return `${days} day${days > 1 ? "s" : ""}`;
  };

  const handleEdit = () => {
    router.push(`/admin-dashboard/tours/${tour.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteTour(tour.id.toString()).unwrap();
      toast.success("Tour deleted successfully");
      setShowDeleteDialog(false);
      router.push(
        pathname.startsWith("/admin-dashboard")
          ? "/admin-dashboard/tours"
          : "/dashboard/tours"
      );
    } catch (error) {
      console.error("Failed to delete tour:", error);
      toast.error("Failed to delete tour");
    }
  };

  const handleBook = async () => {
    if (!user) {
      toast.error("Please log in to book a tour");
      router.push("/login");
      return;
    }

    try {
      await createBooking({
        userId: parseInt(user.id),
        tourId: tour.id,
        totalPrice: tour.price,
      }).unwrap();
      toast.success("Tour booked successfully");
      setShowBookDialog(false);
    } catch (error) {
      console.error("Failed to book tour:", error);
      toast.error("Failed to book tour");
    }
  };

  const handleUnbook = async () => {
    if (!userBooking) return;

    try {
      await deleteBooking(userBooking.id.toString()).unwrap();
      toast.success("Booking cancelled successfully");
      setShowUnbookDialog(false);
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  const truncatedTourName =
    tour.name.length > 50 ? `${tour.name.slice(0, 47)}...` : tour.name;

  const backRoute = pathname.startsWith("/admin-dashboard")
    ? "/admin-dashboard/tours"
    : "/dashboard/tours";

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
              variant={isTourBooked ? "secondary" : "default"}
              size="sm"
              onClick={() =>
                isTourBooked
                  ? setShowUnbookDialog(true)
                  : setShowBookDialog(true)
              }
              disabled={isBooking || isUnbooking}
              className="min-w-[100px]"
            >
              <Bookmark className="mr-2 h-4 w-4" />
              {isTourBooked ? "Unbook" : "Book Now"}
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
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
              {isTourBooked && (
                <Badge variant="outline">
                  Booking Status: {userBooking?.status}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {tour.name}
            </h1>
            {tour.description && (
              <p className="text-lg text-muted-foreground">
                {tour.description}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Location Information */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1">Location</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tour.location}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tour Schedule */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </h3>

              <div className="space-y-4 pl-7">
                <div>
                  <p className="font-medium text-foreground">Start Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(tour.startDate)}
                  </p>
                </div>

                <div>
                  <p className="font-medium text-foreground">End Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(tour.endDate)}
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
                      Max Guests
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {tour.maxGuests}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
