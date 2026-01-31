import React from "react";
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
    <div className="relative h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 space-y-0">
        <CardTitle className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
          {title}
        </CardTitle>
        <div className="h-7 w-7 rounded-lg bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center text-[#1F30AD] transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:from-[#1F30AD] group-hover:to-[#172585] group-hover:text-white group-hover:border-transparent">
          {icon && React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "h-3.5 w-3.5" }) : icon}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <div className="text-xl font-black tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">{value}</div>
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  "flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-colors",
                  trend.isPositive 
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                    : "bg-rose-50 text-rose-600 border border-rose-100"
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpIcon className="mr-0.5 h-2.5 w-2.5" />
                ) : (
                  <ArrowDownIcon className="mr-0.5 h-2.5 w-2.5" />
                )}
                {Math.abs(trend.value)}%
              </span>
            )}
            <span className="text-xs font-medium text-muted-foreground leading-none">
              {description}
            </span>
          </div>
        )}
      </CardContent>
    </div>
  );

  const cardClasses = cn(
    "relative overflow-hidden group border-slate-100 shadow-xs h-full transition-all duration-300 hover:shadow-xl hover:shadow-[#1F30AD]/10 hover:border-blue-100",
    href && "cursor-pointer hover:scale-[1.01] active:scale-[0.99]",
    className
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        <Card className={cardClasses}>
          {cardContent}
          <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#1F30AD] transition-all duration-500 group-hover:w-full" />
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cardClasses}>
      {cardContent}
    </Card>
  );
}
