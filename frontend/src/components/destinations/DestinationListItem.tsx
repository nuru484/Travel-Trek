"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { RootState } from "@/redux/store";
import { useDeleteDestinationMutation } from "@/redux/destinationApi";
import { IDestination } from "@/types/destination.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Eye, Edit, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import toast from "react-hot-toast";
import { truncateText } from "@/utils/truncateText";
import Image from "next/image";

interface IDestinationListItemProps {
  destination: IDestination;
}

export default function DestinationListItem({
  destination,
}: IDestinationListItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "AGENT";
  const [deleteDestination, { isLoading: isDeleting }] =
    useDeleteDestinationMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleView = () => {
    if (pathname.startsWith("/admin-dashboard")) {
      router.push(`/admin-dashboard/destinations/${destination.id}/detail`);
    } else {
      router.push(`/dashboard/destinations/${destination.id}/detail`);
    }
  };

  const handleEdit = () => {
    router.push(`/admin-dashboard/destinations/${destination.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteDestination(destination.id.toString()).unwrap();
      toast.success("Destination deleted successfully");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete destination:", error);
      toast.error("Failed to delete destination");
    }
  };

  const formatDate = (dateInput: string | Date) => {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return format(date, "MMM dd, yyyy");
  };

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Destination Image */}
            <div className="relative w-32 h-28 sm:w-40 sm:h-32 flex-shrink-0">
              {destination.photo ? (
                <Image
                  src={destination.photo}
                  alt={`${destination.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 128px, 160px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
            </div>

            {/* Destination Information */}
            <div className="flex-1 p-4 sm:p-6">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                      {truncateText(destination.name)} - {destination.country}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {destination.city || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Destination Details */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="hidden sm:inline">Created:</span>
                    <span className="font-medium">
                      {destination.createdAt
                        ? formatDate(destination.createdAt)
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleView}
                    className="flex-1 sm:flex-none sm:min-w-[80px] group-hover:border-primary/50 transition-colors"
                  >
                    <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">View</span>
                    <span className="sm:hidden">Details</span>
                  </Button>

                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        className="flex-1 sm:flex-none sm:min-w-[80px]"
                        disabled={isDeleting}
                      >
                        <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Edit</span>
                        <span className="sm:hidden">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive hover:text-destructive hover:border-destructive/50 flex-1 sm:flex-none sm:min-w-[80px]"
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Delete</span>
                        <span className="sm:hidden">Del</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Destination"
        description={`Are you sure you want to delete "${truncateText(
          destination.name
        )}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive
      />
    </>
  );
}
