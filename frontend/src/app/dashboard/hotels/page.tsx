"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { HotelList } from "@/components/hotels/hotel-list";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeleteAllHotelsMutation } from "@/redux/hotelApi";
import toast from "react-hot-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function HotelsPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isAdmin = user?.role === "ADMIN" || user?.role === "AGENT";

  const [deleteAllHotels, { isLoading: isDeletingAll }] =
    useDeleteAllHotelsMutation();

  const handleCreateHotels = () => {
    router.push("/dashboard/hotels/create");
  };

  const handleDeleteAllHotels = async () => {
    try {
      await deleteAllHotels().unwrap();
      toast.success("All hotels deleted successfully");
    } catch (error) {
      console.error("Failed to delete all hotels:", error);
      toast.error("Failed to delete all hotels");
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <CardTitle>Hotels</CardTitle>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCreateHotels}>
              <Plus className="mr-2 h-4 w-4" />
              Create Hotel
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
        <HotelList />
      </div>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete All Hotels"
        description="Are you sure you want to delete all hotels? This action cannot be undone."
        onConfirm={handleDeleteAllHotels}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
