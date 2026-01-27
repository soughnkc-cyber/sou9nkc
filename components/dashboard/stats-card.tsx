"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden group", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="mt-1 flex items-center text-xs text-muted-foreground">
            {trend && (
              <span
                className={cn(
                  "mr-1 flex items-center font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpIcon className="mr-0.5 h-3 w-3" />
                ) : (
                  <ArrowDownIcon className="mr-0.5 h-3 w-3" />
                )}
                {Math.abs(trend.value)}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
