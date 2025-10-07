// src/components/payments/UserProfilePayments.tsx
"use client";
import * as React from "react";
import { PaymentsDataTable } from "@/components/payments/table/PaymentsDataTable";
import { useGetAllUserPaymentsQuery } from "@/redux/paymentApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UserProfilePaymentsProps {
  userId: number;
}

export function UserProfilePayments({ userId }: UserProfilePaymentsProps) {
  const router = useRouter();

  const {
    data: paymentsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllUserPaymentsQuery({
    userId,
    params: {
      limit: 5,
      page: 1,
    },
  });

  const payments = paymentsData?.data || [];
  const totalCount = paymentsData?.meta.total || 0;

  const handleViewAllPayments = () => {
    router.push(`/dashboard/payments?userId=${userId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-24 sm:w-auto" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <PaymentsDataTable
            data={[]}
            loading={true}
            totalCount={0}
            page={1}
            pageSize={5}
            filters={{}}
            onFiltersChange={() => {}}
            onRefresh={refetch}
            showFilters={false}
            showActions={true}
            showPagination={false}
            showSelection={false}
            showUser={false}
            showBooking={true}
            isRecentsView={true}
          />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError && error) {
    const { message } = extractApiErrorMessage(error);
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Payments</AlertTitle>
            <AlertDescription>
              {message || "Failed to load payments. Please try again."}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg sm:text-xl">
              Recent Payments
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {totalCount > 0
                ? `Showing latest ${Math.min(
                    5,
                    totalCount
                  )} of ${totalCount} payments`
                : "No payments found"}
            </p>
          </div>
          {totalCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAllPayments}
              className="w-full sm:w-auto hover:cursor-pointer"
            >
              View All ({totalCount})
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <PaymentsDataTable
          data={payments}
          loading={false}
          totalCount={totalCount}
          page={1}
          pageSize={5}
          filters={{}}
          onFiltersChange={() => {}}
          onRefresh={refetch}
          showFilters={false}
          showActions={true}
          showPagination={false}
          showSelection={false}
          showUser={false}
          showBooking={true}
          isRecentsView={true}
        />
      </CardContent>
    </Card>
  );
}
