"use client";
import { useGetTourQuery } from "@/redux/tourApi";
import { TourForm } from "@/components/tours/tour-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";

export default function EditTourPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, error, isLoading } = useGetTourQuery(id);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="container mx-auto py-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tour Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error ? "Failed to load tour details." : "Tour not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Edit Tour</CardTitle>
        </CardHeader>
        <CardContent>
          <TourForm mode="edit" tour={data?.data} />
        </CardContent>
      </Card>
    </div>
  );
}
