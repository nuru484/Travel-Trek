"use client";
import { useState, useEffect } from "react";
import { useCreateBookingMutation } from "@/redux/bookingApi";
import { useGetAllUsersQuery, useLazySearchUsersQuery } from "@/redux/userApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Bookmark } from "lucide-react";
import toast from "react-hot-toast";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";

interface IBookingBase {
  userId: number;
  totalPrice: number;
}

type IBookingPayload =
  | (IBookingBase & { tourId: number; flightId?: never; roomId?: never })
  | (IBookingBase & { flightId: number; tourId?: never; roomId?: never })
  | (IBookingBase & { roomId: number; tourId?: never; flightId?: never });

interface IBookingButtonProps {
  tourId?: number;
  flightId?: number;
  roomId?: number;
  price: number;
  userId?: number;
  disabled?: boolean;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "destructive"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

export function BookingButton({
  tourId,
  flightId,
  roomId,
  price,
  userId,
  disabled = false,
  variant = "default",
  size = "default",
  className = "",
  label,
}: IBookingButtonProps) {
  const [createBooking, { isLoading }] = useCreateBookingMutation();
  const { data: usersData, isLoading: isUsersLoading } = useGetAllUsersQuery({
    page: 1,
    limit: 50,
  });

  const [
    searchUsers,
    { data: searchData, isError: isSearchError, error: searchError },
  ] = useLazySearchUsersQuery();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Handle search errors
  useEffect(() => {
    if (isSearchError && searchError) {
      const { message } = extractApiErrorMessage(searchError);
      console.error("Failed to search users:", searchError);
      toast.error(message || "Failed to search users");
    }
  }, [isSearchError, searchError]);

  const handleBook = async (finalUserId: number) => {
    try {
      let payload: IBookingPayload;

      if (tourId) {
        payload = { userId: finalUserId, totalPrice: price, tourId };
      } else if (flightId) {
        payload = { userId: finalUserId, totalPrice: price, flightId };
      } else if (roomId) {
        payload = { userId: finalUserId, totalPrice: price, roomId };
      } else {
        throw new Error("No booking type specified");
      }

      await createBooking(payload).unwrap();

      toast.success("Booking created successfully");
      setIsDialogOpen(false);
      setSelectedUserId(null);
    } catch (error) {
      const { message } = extractApiErrorMessage(error);
      console.error("Failed to book:", error);
      toast.error(message || "Failed to create booking");
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (val.trim().length > 1) {
      const delayDebounce = setTimeout(() => {
        searchUsers({ search: val, page: 1, limit: 50 });
      }, 400);
      return () => clearTimeout(delayDebounce);
    }
  };

  const availableUsers =
    searchTerm.trim().length > 1
      ? searchData?.data || []
      : usersData?.data || [];

  return (
    <>
      {userId ? (
        // Normal user: direct booking
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isLoading}
          className={className}
          onClick={() => handleBook(userId)}
        >
          <Bookmark className="mr-2 h-4 w-4" />
          {isLoading ? "Processing..." : label || "Book"}
        </Button>
      ) : (
        // Admin/agent: select user via dialog
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant={variant}
              size={size}
              disabled={disabled || isLoading}
              className={className}
            >
              <Bookmark className="mr-2 h-4 w-4" />
              {label || "Book"}
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Book</DialogTitle>
              <DialogDescription>
                Select a user to book this item on their behalf.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search */}
              <div>
                <Label htmlFor="user-search">Search Users</Label>
                <Input
                  id="user-search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {/* User Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="user-select">Select User</Label>
                <Select
                  value={selectedUserId ? String(selectedUserId) : ""}
                  onValueChange={(val) => setSelectedUserId(Number(val))}
                >
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {isUsersLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading users...
                      </SelectItem>
                    ) : availableUsers.length > 0 ? (
                      availableUsers.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>
                              {u.name} ({u.email})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No users found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  selectedUserId ? handleBook(selectedUserId) : null
                }
                disabled={!selectedUserId || isLoading}
              >
                {isLoading ? "Processing..." : "Confirm Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
