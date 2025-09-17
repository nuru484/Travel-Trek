"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useDeleteHotelMutation } from "@/redux/hotelApi";
import {
  useGetAllBookingsQuery,
  useCreateBookingMutation,
} from "@/redux/bookingApi";
import { useGetAllDestinationsQuery } from "@/redux/destinationApi";
import { IHotel } from "@/types/hotel.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Eye, Edit, Trash2, Star, MapPin, Bookmark } from "lucide-react";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import toast from "react-hot-toast";
import { truncateText } from "@/utils/truncateText";
import Image from "next/image";

interface IHotelListItemProps {
  hotel: IHotel;
}

export function HotelListItem({ hotel }: IHotelListItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "AGENT";
  const [deleteHotel, { isLoading: isDeleting }] = useDeleteHotelMutation();
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);

  // Fetch destinations to get names instead of IDs
  const { data: destinationsData } = useGetAllDestinationsQuery({ limit: 100 });
  const destinations = destinationsData?.data || [];

  // Fetch user's bookings to check if this hotel is already booked
  const { data: bookingsData } = useGetAllBookingsQuery(
    { page: 1, limit: 100 },
    { skip: !user }
  );
  const isHotelBooked = bookingsData?.data.some(
    (booking) =>
      booking.hotelId === hotel.id &&
      booking.userId === parseInt(user?.id || "0")
  );

  const handleView = () => {
    if (pathname.startsWith("/dashboard")) {
      router.push(`/dashboard/hotels/${hotel.id}/detail`);
    } else {
      router.push(`/dashboard/hotels/${hotel.id}/detail`);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/hotels/${hotel.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteHotel(hotel.id.toString()).unwrap();
      toast.success("Hotel deleted successfully");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete hotel:", error);
      toast.error("Failed to delete hotel");
    }
  };

  const handleBook = async () => {
    if (!user) {
      toast.error("Please log in to book a hotel");
      router.push("/login");
      return;
    }

    try {
      await createBooking({
        userId: parseInt(user.id),
        hotelId: hotel.id,
        totalPrice: 0,
      }).unwrap();
      toast.success("Hotel booked successfully");
      setShowBookDialog(false);
    } catch (error) {
      console.error("Failed to book hotel:", error);
      toast.error("Failed to book hotel");
    }
  };

  const getDestinationName = (id: number) => {
    const destination = destinations.find((dest) => dest.id === id);
    return destination
      ? `${destination.city}, ${destination.country}`
      : `ID: ${id}`;
  };

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Hotel Image */}
            <div className="relative w-32 h-28 sm:w-40 sm:h-32 flex-shrink-0">
              {hotel.photo ? (
                <Image
                  src={hotel.photo}
                  alt={hotel.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 128px, 160px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Home className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
            </div>

            {/* Hotel Information */}
            <div className="flex-1 p-4 sm:p-6">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                        {hotel.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {hotel.starRating} Star{hotel.starRating > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {hotel.address}
                    </p>
                  </div>
                </div>

                {/* Location Information */}
                <div className="flex items-center justify-between mb-3 py-2 px-3 bg-muted/30 rounded-lg">
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-semibold text-sm">
                      {hotel.city}, {hotel.country}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getDestinationName(hotel.destinationId)}
                    </p>
                  </div>
                </div>

                {/* Hotel Details */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    <span>{hotel.starRating} Star Rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{hotel.amenities.length} Amenities</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleView}
                    className="flex-1 sm:flex-none sm:min-w-[80px] group-hover:border-primary/50 transition-colors"
                    disabled={isDeleting || isBooking}
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
                      variant={isHotelBooked ? "secondary" : "default"}
                      size="sm"
                      onClick={() => setShowBookDialog(true)}
                      className="flex-1 sm:flex-none sm:min-w-[80px]"
                      disabled={isBooking || isHotelBooked}
                    >
                      <Bookmark className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">
                        {isHotelBooked ? "Booked" : "Book Now"}
                      </span>
                      <span className="sm:hidden">
                        {isHotelBooked ? "Booked" : "Book"}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Hotel"
        description={`Are you sure you want to delete "${truncateText(
          hotel.name
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
          hotel.name
        )}" in ${getDestinationName(hotel.destinationId)}?`}
        onConfirm={handleBook}
        confirmText="Book Now"
      />
    </>
  );
}
