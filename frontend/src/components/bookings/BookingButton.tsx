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
import { User, Bookmark, Search, Loader2 } from "lucide-react";
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
      setSearchTerm("");
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
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Bookmark className="mr-2 h-4 w-4" />
              {label || "Book"}
            </>
          )}
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

          <DialogContent className="max-w-[95vw] sm:max-w-[480px] gap-0 p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
              <DialogTitle className="text-xl font-semibold break-all">
                Create Booking
              </DialogTitle>
              <DialogDescription className="text-left text-sm text-muted-foreground break-all">
                Select a user to create a booking on their behalf.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-6 space-y-5 overflow-hidden">
              {/* Search Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="user-search"
                  className="text-sm font-medium text-foreground"
                >
                  Search Users
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9 h-10 bg-background"
                  />
                </div>
                {searchTerm.trim().length > 1 && (
                  <p className="text-xs text-muted-foreground break-all">
                    {availableUsers.length} user
                    {availableUsers.length !== 1 ? "s" : ""} found
                  </p>
                )}
              </div>

              {/* User Selection */}
              <div className="space-y-2 min-w-0">
                <Label
                  htmlFor="user-select"
                  className="text-sm font-medium text-foreground"
                >
                  Select User
                </Label>
                <Select
                  value={selectedUserId ? String(selectedUserId) : ""}
                  onValueChange={(val) => setSelectedUserId(Number(val))}
                >
                  <SelectTrigger
                    id="user-select"
                    className="h-10 bg-background w-full"
                  >
                    <SelectValue placeholder="Choose a user to book for" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] max-w-[calc(95vw-3rem)] sm:max-w-[432px]">
                    {isUsersLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          Loading users...
                        </span>
                      </div>
                    ) : availableUsers.length > 0 ? (
                      availableUsers.map((u) => (
                        <SelectItem
                          key={u.id}
                          value={String(u.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col min-w-0 w-full">
                            <span className="text-sm font-medium break-all leading-tight w-full">
                              {u.name}
                            </span>
                            <span className="text-xs text-muted-foreground break-all leading-tight mt-0.5 w-full">
                              {u.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <User className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-sm font-medium text-foreground">
                          No users found
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Try adjusting your search
                        </p>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Display */}
              <div className="rounded-lg bg-muted/50 p-4 border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Price
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    ${price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border flex-row gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedUserId(null);
                  setSearchTerm("");
                }}
                disabled={isLoading}
                className="flex-1 sm:flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  selectedUserId ? handleBook(selectedUserId) : null
                }
                disabled={!selectedUserId || isLoading}
                className="flex-1 sm:flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
