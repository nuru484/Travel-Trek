// src/app/dashboard/rooms/create/page.tsx
"use client";
import { RoomForm } from "@/components/rooms/room-fom";
import { useParams } from "next/navigation";

export default function CreateRoomPage() {
  const params = useParams<{ id: string }>();
  const hotelId = parseInt(params.id, 10);

  return (
    <div className="container mx-auto py-6">
      <RoomForm mode="create" hotelId={hotelId} />
    </div>
  );
}
