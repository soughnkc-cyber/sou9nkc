import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string | number;
  trendUp?: boolean;
  color?: string; // Text color class (e.g. "text-blue-600")
  bgColor?: string; // Hex color (e.g. "#e3f0ff")
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color,
  bgColor = "#ffffff", // Default white if not specified
  active,
  onClick,
  className
}: KPICardProps) {
  const isClickable = !!onClick;

  return (
    <Card
      onClick={onClick}
      style={{ backgroundColor: bgColor }}
      className={cn(
        "relative p-3 border-none shadow-sm rounded-xl overflow-hidden flex flex-col transition-all duration-300",
        isClickable ? "cursor-pointer hover:brightness-95 active:scale-95" : "cursor-default",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start">
          {Icon && (
            <div className={cn("p-1.5 rounded-lg w-fit", color)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          
          {(trend !== undefined && trend !== null) && (
            <div className={cn(
              "px-1.5 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-0.5 backdrop-blur-sm",
              trendUp ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"
            )}>
              {trendUp ? <ArrowUpIcon className="h-2.5 w-2.5" /> : <ArrowDownIcon className="h-2.5 w-2.5" />}
              {trend}
            </div>
          )}
        </div>
        
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none mt-1">
          {value}
        </h3>
        
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest opacity-80">
          {title}
        </p>
      </div>

      {active && (
        <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#1F30AD] ring-2 ring-white/20" />
      )}
    </Card>
  );
}
