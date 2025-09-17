"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Calendar, Shield } from "lucide-react";
import { IUser } from "@/types/user.types";

type UserProfileHeaderProps = {
  user: IUser;
};

export function UserProfileHeader({ user }: UserProfileHeaderProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "USER":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      case "MODERATOR":
        return "bg-chart-4/10 text-chart-4 border-chart-4/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="container mx-auto bg-card rounded-2xl p-4 lg:p-8 shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Avatar */}
        <div className="flex-shrink-0 mx-auto lg:mx-0">
          <div className="relative">
            <Avatar className="h-36 w-36 rounded-full shadow-lg ring-4 ring-background">
              <AvatarImage
                src={user.profilePicture || undefined}
                alt={`${user.name} profile picture`}
                className="object-cover rounded-full"
              />
              <AvatarFallback className="rounded-full bg-gradient-to-br from-primary to-chart-1 text-primary-foreground text-2xl font-bold flex items-center justify-center">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-chart-4 rounded-full border-[3px] border-background shadow-sm"></div>
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="text-center lg:text-left">
            {/* Name and Role Badge */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4 mb-3">
              <h1 className="text-2xl font-bold text-foreground mb-2 lg:mb-0">
                {user.name}
              </h1>
              <Badge
                variant="outline"
                className={`w-fit mx-auto lg:mx-0 ${getRoleColor(user.role)}`}
              >
                <Shield className="w-3 h-3 mr-1.5" />
                {user.role}
              </Badge>
            </div>

            {/* Contact Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 text-foreground bg-muted rounded-lg p-3">
                <div className="flex-shrink-0 w-8 h-8 bg-chart-2/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-chart-2" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email ?? "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-foreground bg-muted rounded-lg p-3">
                <div className="flex-shrink-0 w-8 h-8 bg-chart-4/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-chart-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {user.phone ?? "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-foreground bg-muted rounded-lg p-3">
                <div className="flex-shrink-0 w-8 h-8 bg-chart-5/20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-chart-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {user.address ?? "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-foreground bg-muted rounded-lg p-3">
                <div className="flex-shrink-0 w-8 h-8 bg-chart-3/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-chart-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Joined</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-4">
              <Badge
                variant="outline"
                className="bg-chart-4/10 text-chart-4 border-chart-4/20"
              >
                <div className="w-1.5 h-1.5 bg-chart-4 rounded-full mr-1.5"></div>
                Active
              </Badge>
              <Badge
                variant="outline"
                className="bg-chart-2/10 text-chart-2 border-chart-2/20"
              >
                <User className="w-3 h-3 mr-1" />
                Verified User
              </Badge>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-muted-foreground border-t border-border pt-4">
              Last updated: {formatDate(user.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfileHeader;
