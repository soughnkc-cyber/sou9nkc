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
        "relative p-4 border-none shadow-sm rounded-2xl overflow-hidden flex flex-col h-full min-h-[100px] justify-between transition-all duration-300",
        isClickable ? "cursor-pointer hover:brightness-95 active:scale-95" : "cursor-default",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest opacity-70">
          {title}
        </p>
        
        {/* Optional Active Indicator */}
        {active && (
           <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-[#1F30AD] ring-2 ring-white/20" />
        )}

        {/* Icon (Optional placement, maybe background or corner) */}
        {!active && Icon && (
            <div className={cn("p-1.5 rounded-lg bg-white/40", color)}>
                <Icon className="h-4 w-4" />
            </div>
        )}
      </div>

      <div className="flex justify-between items-end mt-2">
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
          {value}
        </h3>
        
        {(trend !== undefined && trend !== null) && (
          <div className={cn(
            "px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm",
            trendUp ? "bg-white/50 text-green-700" : "bg-white/50 text-red-700"
          )}>
            {trendUp ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
    </Card>
  );
}
