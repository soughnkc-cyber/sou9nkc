"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import Link from "next/link";

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
  href?: string; // Add href for navigation
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
  href,
}: StatsCardProps) {
  const cardContent = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        <Card className={cn("overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] h-full", className)}>
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cn("overflow-hidden group h-full", className)}>
      {cardContent}
    </Card>
  );
}
