"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useDeleteTourMutation } from "@/redux/tourApi";
import {
  useGetAllUserBookingsQuery,
  useCreateBookingMutation,
} from "@/redux/bookingApi";
import { ITour } from "@/types/tour.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Clock,
  DollarSign,
  CalendarDays,
  Bookmark,
} from "lucide-react";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import toast from "react-hot-toast";
import { truncateText } from "@/utils/truncateText";

interface ITourListItemProps {
  tour: ITour;
}

export function TourListItem({ tour }: ITourListItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "AGENT";
  const [deleteTour, { isLoading: isDeleting }] = useDeleteTourMutation();
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);

  // Fetch user's bookings to check if this tour is already booked
  const { data: bookingsData } = useGetAllUserBookingsQuery(
    { userId: user.id, params: { page: 1, limit: 1000 } },
    { skip: !user }
  );

  const isTourBooked = bookingsData?.data.some(
    (booking) =>
      booking.tour.id === tour.id &&
      booking.userId === parseInt(user?.id || "0")
  );

  const handleView = () => {
    if (pathname.startsWith("/dashboard")) {
      router.push(`/dashboard/tours/${tour.id}/detail`);
    } else {
      router.push(`/dashboard/tours/${tour.id}/detail`);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/tours/${tour.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteTour(tour.id.toString()).unwrap();
      toast.success("Tour deleted successfully");
      setShowDeleteDialog(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "upcoming":
        return "default";
      case "active":
        return "secondary";
      case "completed":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group border border-border/50 hover:border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-foreground text-lg truncate">
                  {tour.name}
                </h3>
                <Badge
                  variant={getStatusColor(tour.status)}
                  className="text-xs font-medium"
                >
                  {tour.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {tour.description || "No description available"}
              </p>
            </div>
            <div className="ml-4 text-right">
              <div className="flex items-center gap-1 text-primary font-semibold text-lg">
                <DollarSign className="h-4 w-4" />
                <span>${tour.price}</span>
              </div>
              <Badge variant="secondary" className="text-xs mt-1">
                {tour.type}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Tour Details Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium text-sm capitalize truncate">
                  {tour.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium text-sm">{tour.duration} Days</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Max Guests</p>
                <p className="font-medium text-sm">{tour.maxGuests}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium text-sm">
                  {formatDate(tour.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tour Dates</p>
                <p className="font-medium text-sm">
                  {formatDate(tour.startDate)} - {formatDate(tour.endDate)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="font-medium text-sm">
                {formatDate(tour.updatedAt)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              className="flex-1 group-hover:border-primary/50 transition-colors"
              disabled={isDeleting || isBooking}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>

            {isAdmin ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="flex-1"
                  disabled={isDeleting || isBooking}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex-1 text-destructive hover:text-destructive hover:border-destructive/50"
                  disabled={isDeleting || isBooking}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            ) : (
              <Button
                variant={isTourBooked ? "secondary" : "default"}
                size="sm"
                onClick={() => setShowBookDialog(true)}
                className="flex-1"
                disabled={isBooking || isTourBooked}
              >
                <Bookmark className="mr-2 h-4 w-4" />
                {isTourBooked ? "Booked" : "Book Now"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Tour"
        description={`Are you sure you want to delete "${truncateText(
          tour.name
        )}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive
      />

      <ConfirmationDialog
        open={showBookDialog}
        onOpenChange={setShowBookDialog}
        title="Confirm Booking"
        description={`Are you sure you want to book "${truncateText(
          tour.name
        )}" in ${tour.location} for $${tour.price}?`}
        onConfirm={handleBook}
        confirmText="Book Now"
      />
    </>
  );
}
