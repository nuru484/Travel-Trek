"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { TourList } from "@/components/tours/tour-list";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeleteAllToursMutation } from "@/redux/tourApi";
import toast from "react-hot-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function AdminToursPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isAdmin = user?.role === "ADMIN" || user?.role === "AGENT";
  const [deleteAllTours, { isLoading: isDeletingAll }] =
    useDeleteAllToursMutation();

  const handleCreateTour = () => {
    router.push("/dashboard/tours/create");
  };

  const handleDeleteAllTours = async () => {
    try {
      await deleteAllTours().unwrap();
      toast.success("All tours deleted successfully");
    } catch (error) {
      console.error("Failed to delete all tours:", error);
      toast.error("Failed to delete all tours");
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Tours</CardTitle>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateTour}
              className="flex-1 sm:flex-none"
            >
              <Plus className="mr-2 h-4 w-4 hidden sm:inline-block" />
              <span className="text-xs sm:text-sm">Create Tour</span>
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
        <TourList />
      </div>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete All Tours"
        description="Are you sure you want to delete all tours? This action cannot be undone."
        onConfirm={handleDeleteAllTours}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
