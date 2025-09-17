// src/components/dashboard/dashboard-overview.tsx
"use client";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetDashboardStatsQuery } from "@/redux/dashboardApi";
import { StatsCard } from "./stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Plane,
  Hotel,
  MapPin,
  Users,
  Calendar,
  CreditCard,
  RefreshCw,
  TrendingUp,
  Building,
  Map,
} from "lucide-react";
import { Loader2 } from "lucide-react";

export function DashboardOverview() {
  const user = useSelector((state: RootState) => state.auth.user);
  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetDashboardStatsQuery();

  const isAdmin = user?.role === "ADMIN" || user?.role === "AGENT";
  const stats = dashboardData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-destructive mb-4">
            Failed to load dashboard data.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your travel platform today.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tours */}
        <StatsCard
          title="Tours Available"
          value={stats.tours.total}
          subtitle="Total tour packages"
          icon={TrendingUp}
          color="blue"
          details={[
            {
              label: "Upcoming",
              value: stats.tours.upcoming,
              color: "secondary",
            },
            { label: "Ongoing", value: stats.tours.ongoing, color: "default" },
          ]}
        />

        {/* Hotels */}
        <StatsCard
          title="Hotels & Rooms"
          value={stats.hotels.total}
          subtitle="Hotels available"
          icon={Hotel}
          color="green"
          details={[
            {
              label: "Available Rooms",
              value: stats.hotels.availableRooms,
              color: "secondary",
            },
          ]}
        />

        {/* Flights */}
        <StatsCard
          title="Flights Available"
          value={stats.flights.total}
          subtitle="Flight options"
          icon={Plane}
          color="purple"
          details={[
            {
              label: "Available Seats",
              value: stats.flights.availableSeats,
              color: "secondary",
            },
          ]}
        />

        {/* Destinations */}
        <StatsCard
          title="Destinations"
          value={stats.destinations.total}
          subtitle="Places to explore"
          icon={Map}
          color="orange"
        />
      </div>

      {/* Admin/Agent Only Stats */}
      {isAdmin && stats.bookings && stats.users && (
        <>
          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Management Overview
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Bookings */}
              <StatsCard
                title="Bookings"
                value={stats.bookings.total}
                subtitle="Total bookings"
                icon={Calendar}
                color="yellow"
                details={[
                  {
                    label: "Pending",
                    value: stats.bookings.pending,
                    color: "outline",
                  },
                  {
                    label: "Confirmed",
                    value: stats.bookings.confirmed,
                    color: "secondary",
                  },
                  {
                    label: "Completed",
                    value: stats.bookings.completed,
                    color: "default",
                  },
                ]}
              />

              {/* Users */}
              <StatsCard
                title="Users"
                value={stats.users.total}
                subtitle="Registered users"
                icon={Users}
                color="red"
                details={[
                  {
                    label: "Customers",
                    value: stats.users.customers,
                    color: "secondary",
                  },
                  {
                    label: "Agents",
                    value: stats.users.agents,
                    color: "outline",
                  },
                  {
                    label: "Admins",
                    value: stats.users.admins,
                    color: "destructive",
                  },
                ]}
              />
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/tours">
              <Button variant="outline" className="justify-start w-full">
                <TrendingUp className="mr-2 h-4 w-4" />
                Browse Tours
              </Button>
            </Link>
            <Link href="/dashboard/hotels">
              <Button variant="outline" className="justify-start w-full">
                <Hotel className="mr-2 h-4 w-4" />
                Find Hotels
              </Button>
            </Link>
            <Link href="/dashboard/flights">
              <Button variant="outline" className="justify-start w-full">
                <Plane className="mr-2 h-4 w-4" />
                Book Flights
              </Button>
            </Link>
            <Link href="/dashboard/destinations">
              <Button variant="outline" className="justify-start w-full">
                <MapPin className="mr-2 h-4 w-4" />
                Explore Destinations
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Card for Non-Admins */}
      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Your Travel Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Start planning your next adventure!
              </p>
              <div className="flex justify-center gap-2">
                <Button size="sm">View My Bookings</Button>
                <Link href="/dashboard/tours">
                  <Button variant="outline" size="sm">
                    Browse Tours
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
