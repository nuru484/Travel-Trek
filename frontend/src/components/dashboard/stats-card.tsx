// src/components/dashboard/stats-card.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface IStatsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "yellow";
  details?: Array<{
    label: string;
    value: number;
    color?: "default" | "secondary" | "destructive" | "outline";
  }>;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  details,
}: IStatsCardProps) {
  const iconColorClasses = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    purple: "text-purple-600 bg-purple-100",
    orange: "text-orange-600 bg-orange-100",
    red: "text-red-600 bg-red-100",
    yellow: "text-yellow-600 bg-yellow-100",
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-full ${iconColorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <div className="text-2xl font-bold text-foreground">
            {value.toLocaleString()}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {details && details.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {details.map((detail, index) => (
              <Badge
                key={index}
                variant={detail.color || "outline"}
                className="text-xs"
              >
                {detail.label}: {detail.value}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
