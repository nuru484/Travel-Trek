"use client";
import { useGetDestinationQuery } from "@/redux/destinationApi";
import DestinationDetail from "@/components/destinations/DestinationDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";

export default function DestinationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, error, isLoading } = useGetDestinationQuery(id);

  console.log("Flight Detail Data:", data);

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

  if (error || !data) {
    return (
      <div className="container mx-auto py-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Destination Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error
                ? "Failed to load destination details."
                : "Destination not found."}
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
          <CardTitle>Destination Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DestinationDetail destination={data.data} />
        </CardContent>
      </Card>
    </div>
  );
}
