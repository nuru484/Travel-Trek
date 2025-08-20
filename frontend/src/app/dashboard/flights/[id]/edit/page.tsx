// src/app/dashboard/flights/[id]/edit/page.tsx
"use client";
import { useGetFlightQuery } from "@/redux/flightApi";
import { FlightForm } from "@/components/flights/flight-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";

export default function EditFlightPage() {
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
    <div className="container mx-auto py-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Edit Flight</CardTitle>
        </CardHeader>
        <CardContent>
          <FlightForm mode="edit" flight={data.data} />
        </CardContent>
      </Card>
    </div>
  );
}
