"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { RootState } from "@/redux/store";
import { useDeleteHotelMutation } from "@/redux/hotelApi";
import {
  useGetAllUserBookingsQuery,
  useCreateBookingMutation,
  useDeleteBookingMutation,
} from "@/redux/bookingApi";
import { useGetAllDestinationsQuery } from "@/redux/destinationApi";
import { IHotel } from "@/types/hotel.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  MapPin,
  Edit,
  Trash2,
  ArrowLeft,
  Star,
  Bookmark,
} from "lucide-react";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import toast from "react-hot-toast";
import Image from "next/image";

interface IHotelDetailProps {
  hotel: IHotel;
}

export function HotelDetail({ hotel }: IHotelDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN";
  const [deleteHotel, { isLoading: isDeleting }] = useDeleteHotelMutation();
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();
  const [deleteBooking, { isLoading: isUnbooking }] =
    useDeleteBookingMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showUnbookDialog, setShowUnbookDialog] = useState(false);

  // Fetch destinations to get names instead of IDs
  const { data: destinationsData } = useGetAllDestinationsQuery({ limit: 100 });
  const destinations = destinationsData?.data || [];

  // Fetch user's bookings to check if this hotel is booked and its status
  const { data: bookingsData } = useGetAllUserBookingsQuery(
    { userId: user.id, params: { page: 1, limit: 1000 } },
    { skip: !user }
  );

  const userBooking = bookingsData?.data.find(
    (booking) =>
      booking.hotel.id === hotel.id &&
      booking.userId === parseInt(user?.id || "0")
  );

  const isHotelBooked = !!userBooking;

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "EEEE, MMMM dd, yyyy");
  };

  const getDestinationName = (id: number) => {
    const destination = destinations.find((dest) => dest.id === id);
    return destination
      ? `${destination.name} (${destination.city}, ${destination.country})`
      : `Destination ID: ${id}`;
  };

  const handleEdit = () => {
    router.push(`/admin-dashboard/hotels/${hotel.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteHotel(hotel.id.toString()).unwrap();
      toast.success("Hotel deleted successfully");
      setShowDeleteDialog(false);
      router.push(
        pathname.startsWith("/admin-dashboard")
          ? "/admin-dashboard/hotels"
          : "/dashboard/hotels"
      );
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

  const truncatedHotelName =
    hotel.name.length > 50 ? `${hotel.name.slice(0, 47)}...` : hotel.name;

  const backRoute = pathname.startsWith("/admin-dashboard")
    ? "/admin-dashboard/hotels"
    : "/dashboard/hotels";

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
              variant={isHotelBooked ? "secondary" : "default"}
              size="sm"
              onClick={() =>
                isHotelBooked
                  ? setShowUnbookDialog(true)
                  : setShowBookDialog(true)
              }
              disabled={isBooking || isUnbooking}
              className="min-w-[100px]"
            >
              <Bookmark className="mr-2 h-4 w-4" />
              {isHotelBooked ? "Unbook" : "Book Now"}
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden shadow-sm">
        {hotel.photo && (
          <div className="relative w-full h-64 md:h-80 lg:h-96">
            <Image
              src={hotel.photo}
              alt={hotel.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="space-y-2">
                <Badge variant="secondary" className="bg-white/90 text-black">
                  {hotel.starRating} Star{hotel.starRating > 1 ? "s" : ""}
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {hotel.name}
                </h1>
                <p className="text-lg text-white/90">
                  {hotel.city}, {hotel.country}
                </p>
                {isHotelBooked && (
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

        <CardHeader className={hotel.photo ? "pb-4" : "pb-6"}>
          {!hotel.photo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {hotel.starRating} Star{hotel.starRating > 1 ? "s" : ""}
                </Badge>
                {isHotelBooked && (
                  <Badge variant="outline">
                    Booking Status: {userBooking?.status}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {hotel.name}
              </h1>
              <p className="text-lg text-muted-foreground">
                {hotel.city}, {hotel.country}
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Location Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">
                      Address
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {hotel.address}
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
                      {getDestinationName(hotel.destinationId)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hotel Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Home className="h-5 w-5" />
                Hotel Details
              </h3>

              <div className="space-y-4 pl-7">
                {hotel.description && (
                  <div>
                    <p className="font-medium text-foreground">Description</p>
                    <p className="text-sm text-muted-foreground">
                      {hotel.description}
                    </p>
                  </div>
                )}

                <div>
                  <p className="font-medium text-foreground">Star Rating</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {hotel.starRating} Star{hotel.starRating > 1 ? "s" : ""}
                  </p>
                </div>

                {hotel.phone && (
                  <div>
                    <p className="font-medium text-foreground">Contact</p>
                    <p className="text-sm text-muted-foreground">
                      {hotel.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Home className="h-5 w-5" />
                Amenities
              </h3>

              <div className="space-y-4 pl-7">
                <div>
                  <p className="font-medium text-foreground">Amenities</p>
                  {hotel.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No amenities listed
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Creation/Update Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-foreground">
                    Hotel Information
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Created: {formatDate(hotel.createdAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last Updated: {formatDate(hotel.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Hotel"
        description={`Are you sure you want to delete hotel "${truncatedHotelName}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive
      />

      <ConfirmationDialog
        open={showBookDialog}
        onOpenChange={setShowBookDialog}
        title="Confirm Booking"
        description={`Are you sure you want to book hotel "${truncatedHotelName}" in ${getDestinationName(
          hotel.destinationId
        )}?`}
        onConfirm={handleBook}
        confirmText="Book Now"
      />

      <ConfirmationDialog
        open={showUnbookDialog}
        onOpenChange={setShowUnbookDialog}
        title="Cancel Booking"
        description={`Are you sure you want to cancel your booking for hotel "${truncatedHotelName}"?`}
        onConfirm={handleUnbook}
        confirmText="Cancel Booking"
        isDestructive
      />
    </div>
  );
}
