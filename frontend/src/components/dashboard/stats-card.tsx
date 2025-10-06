// src/components/dashboard/stats-card.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

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
  const colorStyles = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
      gradient: "from-blue-500/10 to-transparent",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-950/30",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-800",
      gradient: "from-green-500/10 to-transparent",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-800",
      gradient: "from-purple-500/10 to-transparent",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-950/30",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-800",
      gradient: "from-orange-500/10 to-transparent",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
      gradient: "from-red-500/10 to-transparent",
    },
    yellow: {
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      text: "text-yellow-600 dark:text-yellow-400",
      border: "border-yellow-200 dark:border-yellow-800",
      gradient: "from-yellow-500/10 to-transparent",
    },
  };

  const styles = colorStyles[color];

  return (
    <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border-2 hover:border-primary/20">
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div
          className={`p-2.5 rounded-xl ${styles.bg} ${styles.border} border group-hover:scale-110 transition-transform duration-300 shadow-sm`}
        >
          <Icon className={`h-5 w-5 ${styles.text}`} />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground tracking-tight">
              {value.toLocaleString()}
            </span>
            <TrendingUp
              className={`h-4 w-4 ${styles.text} opacity-0 group-hover:opacity-100 transition-opacity`}
            />
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {details && details.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t">
            {details.map((detail, index) => (
              <Badge
                key={index}
                variant={detail.color || "outline"}
                className="text-xs font-medium px-2.5 py-1 shadow-sm hover:shadow transition-shadow"
              >
                <span className="font-normal text-muted-foreground">
                  {detail.label}:
                </span>{" "}
                <span className="font-semibold">{detail.value}</span>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
