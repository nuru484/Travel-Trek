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

export default function AdminFlightsPage() {
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
      toast.success("All Destinations deleted successfully");
    } catch (error) {
      console.error("Failed to delete all Destinations:", error);
      toast.error("Failed to delete all Destinations");
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <CardTitle>Destinations</CardTitle>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateDestination}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Destination
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeletingAll}
              className="text-destructive hover:text-destructive"
            >
              Delete All
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
        title="Delete All Destination"
        description={`Are you sure you want to delete all destinations? This will delete all flights to these destinations and cannot be undone.`}
        onConfirm={handleDeleteAllDestinations}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
