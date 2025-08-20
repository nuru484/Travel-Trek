"use client";
import { TourForm } from "@/components/tours/tour-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateTourPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Create Tour</CardTitle>
        </CardHeader>
        <CardContent>
          <TourForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}


