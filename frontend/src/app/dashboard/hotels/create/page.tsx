// src/app/dashboard/hotels/create/page.tsx
"use client";
import { HotelForm } from "@/components/hotels/hotel-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateHotelPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Create Hotel</CardTitle>
        </CardHeader>
        <CardContent>
          <HotelForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
