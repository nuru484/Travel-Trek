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
  const isAdmin = user?.role === "ADMIN";
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
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <CardTitle>Tours</CardTitle>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCreateTour}>
              <Plus className="mr-2 h-4 w-4" />
              Create Tour
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
