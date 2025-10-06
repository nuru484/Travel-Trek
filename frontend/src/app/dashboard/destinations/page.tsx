// src/app/dashboard/destinations/page.tsx
"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import DestinationList from "@/components/destinations/DestinationList";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeleteAllDestinationsMutation } from "@/redux/destinationApi";
import toast from "react-hot-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function DestinationsPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "AGENT";
  const [deleteAllDestinations, { isLoading: isDeletingAll }] =
    useDeleteAllDestinationsMutation();

  const handleCreateDestination = () => {
    router.push("/dashboard/destinations/create");
  };

  const handleDeleteAllDestinations = async () => {
    try {
      await deleteAllDestinations().unwrap();
      toast.success("All destinations deleted successfully");
    } catch (error) {
      console.error("Failed to delete all destinations:", error);
      toast.error("Failed to delete all destinations");
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Destinations</CardTitle>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateDestination}
              className="flex-1 sm:flex-none"
            >
              <Plus className="mr-2 h-4 w-4 hidden sm:inline-block" />
              <span className="text-xs sm:text-sm">Create Destination</span>
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
        <DestinationList />
      </div>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete All Destinations"
        description="Are you sure you want to delete all destinations? This will delete all flights to these destinations and cannot be undone."
        onConfirm={handleDeleteAllDestinations}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
