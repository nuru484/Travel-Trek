// src/components/bookings/table/BookingActionsDropdown.tsx
"use client";
import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IBooking } from "@/types/booking.types";
import {
  useUpdateBookingMutation,
  useDeleteBookingMutation,
} from "@/redux/bookingApi";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PaymentButton } from "@/components/payments/PaymentButton";

interface BookingActionsDropdownProps {
  booking: IBooking;
  userRole?: "ADMIN" | "AGENT" | "CUSTOMER";
}

export function BookingActionsDropdown({
  booking,
  userRole = "CUSTOMER",
}: BookingActionsDropdownProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);

  console.log("Booking: ", booking);

  const [updateBooking] = useUpdateBookingMutation();
  const [deleteBooking] = useDeleteBookingMutation();

  const handleCancelBooking = async () => {
    const toastId = toast.loading("Cancelling booking...");

    try {
      await updateBooking({
        bookingId: booking.id,
        data: { status: "CANCELLED" },
      }).unwrap();

      toast.dismiss(toastId);
      toast.success("Booking cancelled successfully");
      setCancelDialogOpen(false);
    } catch (error) {
      const { message } = extractApiErrorMessage(error);
      toast.dismiss(toastId);
      toast.error(message);
    }
  };

  const handleDeleteBooking = async () => {
    const toastId = toast.loading("Deleting booking...");

    try {
      await deleteBooking(booking.id).unwrap();
      toast.dismiss(toastId);
      toast.success("Booking deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      const { message } = extractApiErrorMessage(error);
      toast.dismiss(toastId);
      toast.error(message);
      setDeleteDialogOpen(false);
    }
  };

  const needsPayment = booking.status === "PENDING" && !booking.payment;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:cursor-pointer">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* View Booking Details - Available to all roles */}
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/bookings/${booking.id}`}
              className="hover:cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>

          {/* Make Payment - Available to customers and agents, only if payment is needed */}
          {needsPayment && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <PaymentButton
                  bookingId={booking.id}
                  amount={booking.totalPrice}
                  currency={"GHS"}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 hover:cursor-pointer"
                />
              </div>
            </>
          )}

          {/* Cancel Booking - Available only to admins */}
          {userRole === "ADMIN" && booking.status !== "CANCELLED" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="hover:cursor-pointer text-orange-600"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Booking
              </DropdownMenuItem>
            </>
          )}

          {/* Delete Booking - Available only to admins */}
          {userRole === "ADMIN" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 hover:cursor-pointer"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Booking
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Booking"
        description={`Are you sure you want to delete booking #${booking.id
          .toString()
          .padStart(6, "0")}? This action cannot be undone.`}
        onConfirm={handleDeleteBooking}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Booking"
        description={`Are you sure you want to cancel booking #${booking.id
          .toString()
          .padStart(6, "0")}? This action cannot be undone.`}
        onConfirm={handleCancelBooking}
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        isDestructive={true}
      />
    </>
  );
}
