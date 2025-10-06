// src/app/dashboard/flights/page.tsx
"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { FlightList } from "@/components/flights/flight-list";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeleteAllFlightsMutation } from "@/redux/flightApi";
import toast from "react-hot-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function FlightsPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isAdmin = user?.role === "ADMIN" || user?.role === "AGENT";
  const [deleteAllFlights, { isLoading: isDeletingAll }] =
    useDeleteAllFlightsMutation();

  const handleCreateFlight = () => {
    router.push("/dashboard/flights/create");
  };

  const handleDeleteAllFlights = async () => {
    try {
      await deleteAllFlights().unwrap();
      toast.success("All flights deleted successfully");
    } catch (error) {
      console.error("Failed to delete all flights:", error);
      toast.error("Failed to delete all flights");
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Flights</CardTitle>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateFlight}
              className="flex-1 sm:flex-none"
            >
              <Plus className="mr-2 h-4 w-4 hidden sm:inline-block" />
              <span className="text-xs sm:text-sm">Create Flight</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeletingAll}
              className="flex-1 sm:flex-none text-destructive hover:text-destructive"
            >
              <span className="text-xs sm:text-sm">Delete All</span>
            </Button>
          </div>
        )}
      </div>
      <div>
        <FlightList />
      </div>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete All Flights"
        description="Are you sure you want to delete all flights? This action cannot be undone."
        onConfirm={handleDeleteAllFlights}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
