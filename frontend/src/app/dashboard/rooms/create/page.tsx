// src/app/dashboard/rooms/create/page.tsx
"use client";
import { RoomForm } from "@/components/rooms/room-fom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateHotelPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Create Room</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
