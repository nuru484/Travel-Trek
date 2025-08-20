// src/app/dashboard/flights/[id]/detail/page.tsx
"use client";
import { useGetFlightQuery } from "@/redux/flightApi";
import { FlightDetail } from "@/components/flights/flight-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";

export default function FlightDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, error, isLoading } = useGetFlightQuery(id);

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
            <CardTitle>Flight Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error ? "Failed to load flight details." : "Flight not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div>
        <FlightDetail flight={data.data} />
      </div>
    </div>
  );
}
