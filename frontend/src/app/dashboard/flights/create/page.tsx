// src/app/dashboard/flights/create/page.tsx
"use client";

import { FlightForm } from "@/components/flights/flight-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

export default function CreateFlightPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.push("/dashboard/flights");
  };

  return (
    <div className="container mx-auto space-y-10">
      <div className="border-b border-border pb-4 sm:pb-6">
        {/* Mobile Layout */}
        <div className="flex flex-col space-y-3 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2 self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Create Flight</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add a new flight
            </p>
          </div>
        </div>

        {/* Tablet/Desktop Layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Create Flight
              </h1>
              <p className="text-sm text-muted-foreground">
                Add details for a new flight
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2 shrink-0 ml-4 hover:cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Flights</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </div>

      <FlightForm mode="create" />
    </div>
  );
}
