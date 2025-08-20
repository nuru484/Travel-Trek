// src/app/dashboard/flights/create/page.tsx
"use client";
import { FlightForm } from "@/components/flights/flight-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateFlightPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Create Flight</CardTitle>
        </CardHeader>
        <CardContent>
          <FlightForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}


