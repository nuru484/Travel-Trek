"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DetailedViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top buttons */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" disabled>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2 ml-auto">
          <Skeleton className="h-9 w-[100px] rounded-md" />
          <Skeleton className="h-9 w-[100px] rounded-md" />
        </div>
      </div>

      {/* Card with image placeholder */}
      <Card className="overflow-hidden shadow-sm">
        <div className="relative w-full h-64 md:h-80 lg:h-96">
          <Skeleton className="h-full w-full" />
          <div className="absolute bottom-6 left-6 space-y-2">
            <Skeleton className="h-8 w-48 rounded-md" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
        </div>

        <CardHeader className="pb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-md" />
            <Skeleton className="h-5 w-40 rounded-md" />
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Destination Info grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-secondary">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="space-y-4 pl-7">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-3 w-60" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
