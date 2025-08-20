"use client";
import DestinationForm from "@/components/destinations/DestinationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateDestinationPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Create Destination</CardTitle>
        </CardHeader>
        <CardContent>
          <DestinationForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
