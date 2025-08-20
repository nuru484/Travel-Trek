"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { RootState } from "@/redux/store";
import { useDeleteDestinationMutation } from "@/redux/destinationApi";
import { IDestination } from "@/types/destination.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, Edit, Trash2, ArrowLeft } from "lucide-react";
import { ConfirmationDialog } from "../ui/confirmation-dialog";
import toast from "react-hot-toast";
import Image from "next/image";

interface IDestinationDetailProps {
  destination: IDestination;
}

export default function DestinationDetail({
  destination,
}: IDestinationDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "AGENT";
  const [deleteDestination, { isLoading: isDeleting }] =
    useDeleteDestinationMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = () => {
    router.push(`/admin-dashboard/destinations/${destination.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteDestination(destination.id.toString()).unwrap();
      toast.success("Destination deleted successfully");
      setShowDeleteDialog(false);
      router.push(
        pathname.startsWith("/admin-dashboard")
          ? "/admin-dashboard/destinations"
          : "/dashboard/destinations"
      );
    } catch (error) {
      console.error("Failed to delete destination:", error);
      toast.error("Failed to delete destination");
    }
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "EEEE, MMMM dd, yyyy");
  };

  const truncatedName =
    destination?.name?.length > 50
      ? `${destination?.name.slice(0, 47)}...`
      : destination?.name;

  const backRoute = pathname.startsWith("/admin-dashboard")
    ? "/admin-dashboard/destinations"
    : "/dashboard/destinations";

  const showEditDeleteButtons = isAdmin && !pathname.startsWith("/dashboard");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(backRoute)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {showEditDeleteButtons && (
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              disabled={isDeleting}
              className="min-w-[100px]"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive min-w-[100px]"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card className="overflow-hidden shadow-sm">
        {destination.photo && (
          <div className="relative w-full h-64 md:h-80 lg:h-96">
            <Image
              src={destination.photo}
              alt={`${destination.name}`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {destination.name}
                </h1>
                <p className="text-lg text-white/90">
                  {destination.city}, {destination.country}
                </p>
              </div>
            </div>
          </div>
        )}

        <CardHeader className={destination.photo ? "pb-4" : "pb-6"}>
          {!destination.photo && (
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {destination.name}
              </h1>
              <p className="text-lg text-muted-foreground">
                {destination.city}, {destination.country}
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Destination Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">
                      Location
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {destination.city}, {destination.country}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-secondary-foreground mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">
                      Created
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {destination.createdAt
                        ? formatDate(destination.createdAt)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Details
              </h3>
              <div className="space-y-4 pl-7">
                <div>
                  <p className="font-medium text-foreground">Name</p>
                  <p className="text-sm text-muted-foreground">
                    {destination.name}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {destination.description || "No description available"}
                  </p>
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
        description={`Are you sure you want to delete "${truncatedName}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
