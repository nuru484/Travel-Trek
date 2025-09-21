// src/components/rooms/room-detail.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useDeleteRoomMutation } from "@/redux/roomApi";
import {
  useGetAllUserBookingsQuery,
  useCreateBookingMutation,
} from "@/redux/bookingApi";
import { IRoom } from "@/types/room.types";
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
  Bed,
  Users,
  DollarSign,
  Edit,
  Trash2,
  Calendar,
  MoreHorizontal,
  Building,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import toast from "react-hot-toast";
import Image from "next/image";

interface IRoomDetailProps {
  room: IRoom;
}

export function RoomDetail({ room }: IRoomDetailProps) {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN";
  const [deleteRoom, { isLoading: isDeleting }] = useDeleteRoomMutation();
  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);

  // Fetch user's bookings to check if this room is already booked
  const { data: bookingsData } = useGetAllUserBookingsQuery(
    { userId: user?.id, params: { page: 1, limit: 1000 } },
    { skip: !user }
  );

  // Check if current room is already booked by the user
  const isRoomBooked = bookingsData?.data.some(
    (booking) =>
      booking?.room?.id === room.id &&
      booking.userId === parseInt(user?.id || "0")
  );

  const handleEdit = () => {
    router.push(`/dashboard/rooms/${room.id}/edit`);
  };

  const handleBooking = () => {
    if (isRoomBooked) {
      toast.error("You have already booked this room");
      return;
    }
    setShowBookDialog(true);
  };

  const handleBookConfirm = async () => {
    if (!user?.id) {
      toast.error("Please log in to book a room");
      return;
    }

    try {
      await createBooking({
        userId: parseInt(user.id),
        roomId: room.id,
        totalPrice: room.price,
      }).unwrap();
      toast.success("Room booked successfully");
      setShowBookDialog(false);
    } catch (error) {
      console.error("Failed to book room:", error);
      toast.error("Failed to book room");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoom(room.id).unwrap();
      toast.success("Room deleted successfully");
      setShowDeleteDialog(false);
      router.push("/dashboard/rooms");
    } catch (error) {
      console.error("Failed to delete room:", error);
      toast.error("Failed to delete room");
    }
  };

  const handleHotelClick = () => {
    if (room.hotel) {
      router.push(`/dashboard/hotels/${room.hotel.id}/detail`);
    }
  };

  const truncatedRoomType =
    room.roomType.length > 50
      ? `${room.roomType.slice(0, 47)}...`
      : room.roomType;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="overflow-hidden shadow-sm">
          {room.photo && (
            <div className="relative w-full h-64 md:h-80 lg:h-96">
              <Image
                src={room.photo}
                alt={room.roomType}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* Action buttons - Admin and User */}
              <div className="absolute top-4 right-4 flex gap-2">
                {/* Book Now Button for Users */}
                {!isAdmin && room.available && (
                  <Button
                    onClick={handleBooking}
                    size="sm"
                    className={`${
                      isRoomBooked
                        ? "bg-secondary hover:bg-secondary text-secondary-foreground"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    } shadow-sm`}
                    disabled={isDeleting || isBooking || isRoomBooked}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">
                      {isRoomBooked ? "Booked" : "Book Now"}
                    </span>
                    <span className="sm:hidden">
                      {isRoomBooked ? "Booked" : "Book"}
                    </span>
                  </Button>
                )}

                {/* Admin Actions */}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-black shadow-sm hover:cursor-pointer"
                        disabled={isDeleting}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={handleEdit}
                        disabled={isDeleting}
                        className="hover:cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Room
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isDeleting}
                        className="text-destructive focus:text-destructive hover:cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Room
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="absolute bottom-6 left-4 sm:left-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={room.available ? "default" : "destructive"}
                      className="bg-white/90 text-black"
                    >
                      {room.available ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Available
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Unavailable
                        </>
                      )}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-white/90 text-black"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {room.capacity} Guest{room.capacity > 1 ? "s" : ""}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-white/90 text-black"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      {formatPrice(room.price)}/night
                    </Badge>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                    {room.roomType}
                  </h1>
                  {room.hotel && (
                    <p className="text-sm sm:text-base text-white/90">
                      {room.hotel.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <CardContent className="space-y-6 sm:space-y-8">
            {/* Hotel Information & Availability Status */}
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              {room.hotel && (
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground mb-1">
                          Hotel
                        </p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={handleHotelClick}
                              className="text-sm text-muted-foreground hover:text-primary transition-colors text-left w-full hover:underline"
                            >
                              {room.hotel.name}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Hotel Details</p>
                          </TooltipContent>
                        </Tooltip>
                        {room.hotel.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {room.hotel.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card
                className={`border-l-4 ${
                  room.available ? "border-l-green-500" : "border-l-destructive"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {room.available ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-foreground mb-1">
                        Availability
                      </p>
                      <p
                        className={`text-sm ${
                          room.available ? "text-green-600" : "text-destructive"
                        }`}
                      >
                        {room.available
                          ? "Available for booking"
                          : "Currently unavailable"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Room Details and Pricing */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  Room Details
                </h3>

                <div className="space-y-4 pl-7">
                  <div>
                    <p className="font-medium text-foreground">Room Type</p>
                    <p className="text-sm text-muted-foreground">
                      {room.roomType}
                    </p>
                  </div>

                  {room.description && (
                    <div>
                      <p className="font-medium text-foreground">Description</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {room.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="font-medium text-foreground">Capacity</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {room.capacity} guest{room.capacity > 1 ? "s" : ""}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-foreground">Amenities</p>
                    {room.amenities && room.amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing & Booking
                </h3>

                <div className="space-y-4 pl-7">
                  <div>
                    <p className="font-medium text-foreground">
                      Price per Night
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(room.price)}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-foreground">Status</p>
                    <p
                      className={`text-sm flex items-center gap-2 ${
                        room.available ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      {room.available ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          {isRoomBooked
                            ? "Already booked by you"
                            : "Ready to book"}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          Not available
                        </>
                      )}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    {!isAdmin && room.available && !isRoomBooked && (
                      <Button
                        onClick={handleBooking}
                        className="w-full"
                        size="lg"
                        disabled={isBooking}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {isBooking ? "Booking..." : "Book This Room"}
                      </Button>
                    )}

                    {!isAdmin && room.available && isRoomBooked && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        size="lg"
                        disabled
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Already Booked
                      </Button>
                    )}

                    {!isAdmin && !room.available && (
                      <Button disabled className="w-full" size="lg">
                        <XCircle className="h-4 w-4 mr-2" />
                        Room Unavailable
                      </Button>
                    )}

                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleEdit}
                          variant="outline"
                          className="flex-1"
                          disabled={isDeleting}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => setShowDeleteDialog(true)}
                          variant="destructive"
                          className="flex-1"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile-only action buttons */}
            <div className="block sm:hidden">
              {!isAdmin && room.available && !isRoomBooked && (
                <Button
                  onClick={handleBooking}
                  className="w-full"
                  size="lg"
                  disabled={isBooking}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {isBooking ? "Booking..." : "Book This Room"}
                </Button>
              )}

              {!isAdmin && room.available && isRoomBooked && (
                <Button
                  variant="secondary"
                  className="w-full"
                  size="lg"
                  disabled
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Already Booked
                </Button>
              )}

              {!isAdmin && !room.available && (
                <Button disabled className="w-full" size="lg">
                  <XCircle className="h-4 w-4 mr-2" />
                  Room Unavailable
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Room Confirmation Dialog */}
        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Delete Room"
          description={`Are you sure you want to delete room "${truncatedRoomType}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          confirmText="Delete"
          isDestructive
        />

        {/* Book Room Confirmation Dialog */}
        <ConfirmationDialog
          open={showBookDialog}
          onOpenChange={setShowBookDialog}
          title="Confirm Room Booking"
          description={`Are you sure you want to book "${room.roomType}"${
            room.hotel ? ` at "${room.hotel.name}"` : ""
          } for ${formatPrice(room.price)} per night?`}
          onConfirm={handleBookConfirm}
          confirmText={isBooking ? "Booking..." : "Book Room"}
        />
      </div>
    </TooltipProvider>
  );
}
