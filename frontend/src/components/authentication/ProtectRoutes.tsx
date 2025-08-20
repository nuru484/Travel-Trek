"use client";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { RootState } from "@/redux/store";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "../ui/card";

// Sidebar Skeleton Component
function SidebarSkeleton() {
  return (
    <div className="w-64 bg-background border-r">
      <div className="p-6">
        {/* Logo/Brand area */}
        <Skeleton className="h-8 w-32 mb-8" />

        {/* Navigation items */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* User section */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-foreground/5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Header Skeleton Component
function HeaderSkeleton() {
  return (
    <header className="bg-background border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </header>
  );
}

// Card Skeleton Component
function CardSkeleton({
  variant = "default",
}: {
  variant?: "default" | "stat" | "chart";
}) {
  if (variant === "stat") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (variant === "chart") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-4 p-3 rounded-lg bg-foreground/5"
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Dashboard Skeleton Component
export function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-primary/5">
      <SidebarSkeleton />

      <div className="flex-1 flex flex-col">
        <HeaderSkeleton />

        <main className="flex-1 p-6 overflow-auto">
          {/* Page Title */}
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} variant="stat" />
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <CardSkeleton variant="chart" />
            </div>
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}

interface ProtectedProps {
  children: React.ReactNode;
}

export default function ProtectRoutes({ children }: ProtectedProps) {
  const user = useSelector((state: RootState) => state.auth.user);

  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return <DashboardSkeleton />;
  }

  return <>{children}</>;
}
