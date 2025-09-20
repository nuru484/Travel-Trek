// src/components/bookings/table/columns.tsx
"use client";
import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Calendar, Package, Hotel, Plane } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { IBooking } from "@/types/booking.types";
import { BookingActionsDropdown } from "./BookingActionsDropdown";

const getBookingTypeIcon = (type: IBooking["type"]) => {
  switch (type) {
    case "TOUR":
      return <Package className="w-4 h-4" />;
    case "HOTEL":
      return <Hotel className="w-4 h-4" />;
    case "FLIGHT":
      return <Plane className="w-4 h-4" />;
    default:
      return null;
  }
};

const getStatusVariant = (status: IBooking["status"]) => {
  switch (status) {
    case "CONFIRMED":
      return "default";
    case "COMPLETED":
      return "secondary";
    case "PENDING":
      return "outline";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
};

const getPaymentStatusVariant = (
  paymentStatus: IBooking["payment"]["status"] | undefined
) => {
  switch (paymentStatus) {
    case "COMPLETED":
      return "default";
    case "PENDING":
      return "outline";
    case "FAILED":
      return "destructive";
    case "REFUNDED":
      return "secondary";
    default:
      return "outline";
  }
};

export const createBookingColumns = (
  showActions: boolean = true,
  showCustomer: boolean = true,
  userRole: "ADMIN" | "AGENT" | "CUSTOMER"
): ColumnDef<IBooking>[] => {
  const columns: ColumnDef<IBooking>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // Removed Booking ID column
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const booking = row.original;
        return (
          <div className="flex items-center gap-2">
            {getBookingTypeIcon(booking.type)}
            <Badge variant="outline" className="text-xs">
              {booking.type}
            </Badge>
          </div>
        );
      },
    },
  ];

  // Conditionally add customer column
  if (showCustomer) {
    columns.push({
      accessorKey: "user",
      header: "Customer",
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <div className="max-w-[200px] sm:max-w-[300px]">
            <div className="font-medium truncate text-sm sm:text-base">
              {user.name}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-1">
              {user.email}
            </div>
          </div>
        );
      },
    });
  }

  // Add remaining columns
  columns.push(
    {
      accessorKey: "service",
      header: "Service",
      cell: ({ row }) => {
        const booking = row.original;
        let serviceName = "";

        switch (booking.type) {
          case "TOUR":
            serviceName = booking.tour.name;
            break;
          case "HOTEL":
            serviceName = `${booking.hotel.name} - ${booking?.room?.roomType}`;
            break;
          case "FLIGHT":
            serviceName = `${booking.flight.airline} ${booking.flight.flightNumber}`;
            break;
        }

        return (
          <div className="max-w-[200px] truncate text-sm">{serviceName}</div>
        );
      },
    },
    {
      accessorKey: "totalPrice",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-semibold hover:bg-transparent"
        >
          Total Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const totalPrice = row.getValue("totalPrice") as number;
        return <div className="font-medium">${totalPrice.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as IBooking["status"];
        return (
          <Badge variant={getStatusVariant(status)} className="text-xs">
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "payment",
      header: "Payment",
      cell: ({ row }) => {
        const payment = row.original.payment;
        if (!payment) {
          return (
            <Badge variant="outline" className="text-xs">
              No Payment
            </Badge>
          );
        }
        return (
          <div className="space-y-1">
            <Badge
              variant={getPaymentStatusVariant(payment.status)}
              className="text-xs"
            >
              {payment.status}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {payment.paymentMethod.replace("_", " ")}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "bookingDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-semibold hover:bg-transparent"
        >
          <Calendar className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Booking Date</span>
          <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("bookingDate") as string);
        return (
          <div className="text-xs sm:text-sm">
            <div className="sm:hidden">{format(date, "MMM dd")}</div>
            <div className="hidden sm:block">
              {format(date, "MMM dd, yyyy")}
            </div>
          </div>
        );
      },
    }
    // Removed Created At column
  );

  if (showActions) {
    columns.push({
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <BookingActionsDropdown booking={row.original} userRole={userRole} />
      ),
    });
  }

  return columns;
};
