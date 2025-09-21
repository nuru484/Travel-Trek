"use client";
import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useDeleteHotelMutation } from "@/redux/hotelApi";
import {
  useGetAllUserBookingsQuery,
  useCreateBookingMutation,
} from "@/redux/bookingApi";
import { IHotel } from "@/types/hotel.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Home,
  Eye,
  Edit,
  Trash2,
  Star,
  MapPin,
  Bed,
  Search,
  Calendar,
} from "lucide-react";
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
  const [showRooms, setShowRooms] = useState(false);
  const [roomSearch, setRoomSearch] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Fetch user's bookings to check if rooms are already booked
  const { data: bookingsData } = useGetAllUserBookingsQuery(
    { userId: user?.id, params: { page: 1, limit: 1000 } },
    { skip: !user }
  );

  // Filter and search rooms
  const filteredRooms = useMemo(() => {
    if (!hotel.rooms || hotel.rooms.length === 0) return [];

    return hotel.rooms.filter(
      (room) =>
        room.roomType.toLowerCase().includes(roomSearch.toLowerCase()) ||
        (room.description &&
          room.description.toLowerCase().includes(roomSearch.toLowerCase()))
    );
  }, [hotel.rooms, roomSearch]);

  // Get displayed rooms based on selection
  const displayedRooms = useMemo(() => {
    if (selectedRoomId && selectedRoom) {
      return [selectedRoom];
    }
    return filteredRooms;
  }, [selectedRoomId, selectedRoom, filteredRooms]);

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

  const handleRoomBook = async (roomId: number) => {
    const isRoomBooked = bookingsData?.data.some(
      (booking) =>
        booking?.room?.id === roomId &&
        booking.userId === parseInt(user?.id || "0")
    );

    if (isRoomBooked) {
      toast.error("You have already booked this room");
      return;
    }

    setSelectedRoom(hotel.rooms?.find((room) => room.id === roomId));
    setShowBookDialog(true);
  };

  const handleBookConfirm = async () => {
    if (!selectedRoom) return;

    try {
      await createBooking({
        userId: parseInt(user.id),
        roomId: selectedRoom.id,
        totalPrice: selectedRoom.price || 100,
      }).unwrap();
      toast.success("Room booked successfully");
      setShowBookDialog(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error("Failed to book room:", error);
      toast.error("Failed to book room");
    }
  };

  const handleRoomView = (roomId: number) => {
    if (pathname.startsWith("/dashboard")) {
      router.push(`/dashboard/hotels/${hotel.id}/rooms/${roomId}`);
    } else {
      router.push(`/hotels/${hotel.id}/rooms/${roomId}`);
    }
  };

  const getDestinationName = () => {
    if (hotel.destination) {
      return `${hotel.destination.name}, ${hotel.destination.country}`;
    }

    return "Unknown destination";
  };

  const toggleRoomsView = () => {
    setShowRooms(!showRooms);
    if (!showRooms) {
      setRoomSearch("");
      setSelectedRoomId("");
      setSelectedRoom(null);
    }
  };

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = hotel.rooms?.find((r) => r.id.toString() === roomId);
    setSelectedRoom(room || null);
  };

  const clearRoomSelection = () => {
    setSelectedRoomId("");
    setSelectedRoom(null);
  };

  const isRoomBooked = (roomId: number) => {
    return bookingsData?.data.some(
      (booking) =>
        booking?.room?.id === roomId &&
        booking.userId === parseInt(user?.id || "0")
    );
  };

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col">
            {/* Main Hotel Info */}
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
                          {hotel.starRating} Star
                          {hotel.starRating > 1 ? "s" : ""}
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
                        {getDestinationName()}
                      </p>
                    </div>
                  </div>

                  {/* Hotel Details */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>{hotel.starRating} Star Rating</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{hotel.amenities?.length || 0} Amenities</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bed className="h-3 w-3" />
                        <span>{hotel.rooms?.length || 0} Rooms</span>
                      </div>
                    </div>
                  </div>

                  {/* Rooms Toggle Button */}
                  {hotel.rooms && hotel.rooms.length > 0 && (
                    <div className="mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleRoomsView}
                        className="w-full justify-between hover:bg-muted/50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4" />
                          <span>View Rooms ({hotel.rooms.length})</span>
                        </div>
                        <span className="text-xs">
                          {showRooms ? "Hide" : "Show"}
                        </span>
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleView}
                      className="flex-1 sm:flex-none sm:min-w-[80px] group-hover:border-primary/50 transition-colors cursor-pointer"
                      disabled={isDeleting}
                    >
                      <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">View</span>
                      <span className="sm:hidden">Details</span>
                    </Button>

                    {isAdmin && (
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable Rooms Section */}
            {showRooms && hotel.rooms && hotel.rooms.length > 0 && (
              <div className="border-t bg-muted/20 p-4">
                <div className="space-y-3">
                  {/* Search and Select Row */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search rooms..."
                        value={roomSearch}
                        onChange={(e) => setRoomSearch(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <Select
                      value={selectedRoomId}
                      onValueChange={handleRoomSelect}
                    >
                      <SelectTrigger className="w-[200px] h-9 cursor-pointer">
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredRooms.map((room) => (
                          <SelectItem
                            key={room.id}
                            value={room.id.toString()}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Bed className="h-4 w-4" />
                              <span>{room.roomType}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rooms List */}
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {displayedRooms.length > 0 ? (
                      displayedRooms.map((room) => (
                        <div
                          key={room.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Bed className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium text-sm truncate">
                                {room.roomType}
                              </h4>
                              {room.price && (
                                <Badge variant="outline" className="text-xs">
                                  ${room.price}
                                </Badge>
                              )}
                            </div>
                            {room.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {room.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-3 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoomView(room.id)}
                              className="cursor-pointer"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>

                            {!isAdmin && (
                              <Button
                                size="sm"
                                variant={
                                  isRoomBooked(room.id)
                                    ? "secondary"
                                    : "default"
                                }
                                onClick={() => handleRoomBook(room.id)}
                                disabled={isBooking || isRoomBooked(room.id)}
                                className="cursor-pointer"
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                {isRoomBooked(room.id) ? "Booked" : "Book"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <Bed className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {roomSearch
                            ? "No rooms found matching your search"
                            : "No rooms available"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats and Controls */}
                  {filteredRooms.length > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>
                        Showing {displayedRooms.length} of {hotel.rooms.length}{" "}
                        rooms
                      </span>
                      <div className="flex gap-2">
                        {roomSearch && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRoomSearch("")}
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80 cursor-pointer"
                          >
                            Clear search
                          </Button>
                        )}
                        {selectedRoomId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearRoomSelection}
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80 cursor-pointer"
                          >
                            Show all rooms
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
        title="Confirm Room Booking"
        description={
          selectedRoom
            ? `Are you sure you want to book "${
                selectedRoom.roomType
              }" at "${truncateText(hotel.name)}" in ${getDestinationName()}?`
            : ""
        }
        onConfirm={handleBookConfirm}
        confirmText="Book Room"
      />
    </>
  );
}
