// src/components/hotels/hotel-detail.tsx
"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useDeleteHotelMutation } from "@/redux/hotelApi";
import { IHotel } from "@/types/hotel.types";
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
  Home,
  MapPin,
  Edit,
  Trash2,
  Star,
  Bed,
  MousePointer,
  MoreHorizontal,
  Plus,
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = () => {
    router.push(`/admin-dashboard/hotels/${hotel.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteHotel(hotel.id).unwrap();
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

  const handleRoomClick = (roomId: number) => {
    router.push(`/dashboard/rooms/${roomId}/detail`);
  };

  const handleCreateRoom = () => {
    router.push(`/dashboard/hotels/${hotel.id}/create-room`);
  };

  const truncatedHotelName =
    hotel.name.length > 50 ? `${hotel.name.slice(0, 47)}...` : hotel.name;

  const availableRooms = hotel.rooms?.length || 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
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

              {isAdmin && (
                <div className="absolute top-4 right-4">
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
                        Edit Hotel
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isDeleting}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Hotel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <div className="absolute bottom-6 left-6">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-white/90 text-black"
                    >
                      {hotel.starRating} Star{hotel.starRating > 1 ? "s" : ""}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-white/90 text-black"
                    >
                      {availableRooms} Room{availableRooms !== 1 ? "s" : ""}{" "}
                      Available
                    </Badge>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {hotel.name}
                  </h1>
                  <p className="text-lg text-white/90">
                    {hotel.city}, {hotel.country}
                  </p>
                </div>
              </div>
            </div>
          )}

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

              {hotel.destination && (
                <Card className="border-l-4 border-l-secondary">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-secondary-foreground mt-1" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground mb-1">
                          Destination
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {hotel.destination.name}
                        </p>
                        {hotel.destination.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {hotel.destination.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Hotel Details and Available Rooms */}
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Bed className="h-5 w-5" />
                    Available Rooms
                  </h3>
                  {isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleCreateRoom}
                          size="sm"
                          className="cursor-pointer"
                          disabled={isDeleting}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Room
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Create new room for this hotel</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <div className="space-y-4 pl-7">
                  <div>
                    <p className="font-medium text-foreground">Room Count</p>
                    <p className="text-sm text-muted-foreground">
                      {availableRooms} room{availableRooms !== 1 ? "s" : ""}{" "}
                      available
                    </p>
                  </div>

                  {hotel.rooms && hotel.rooms.length > 0 && (
                    <div>
                      <p className="font-medium text-foreground mb-2">
                        Room Types
                      </p>
                      <div className="space-y-2">
                        {hotel.rooms.map((room) => (
                          <Tooltip key={room.id}>
                            <TooltipTrigger asChild>
                              <div
                                className="border rounded-lg p-3 cursor-pointer hover:border-primary hover:shadow-sm transition-all duration-200 hover:bg-muted/30 group"
                                onClick={() => handleRoomClick(room.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm group-hover:text-primary transition-colors">
                                      {room.roomType}
                                    </p>
                                    {room.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {room.description}
                                      </p>
                                    )}
                                  </div>
                                  <MousePointer className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View room details</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!hotel.rooms || hotel.rooms.length === 0) && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        No rooms currently available
                      </p>
                      {isAdmin && (
                        <Button
                          onClick={handleCreateRoom}
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          disabled={isDeleting}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Room
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
      </div>
    </TooltipProvider>
  );
}
