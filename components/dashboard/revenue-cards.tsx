"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon, DollarSignIcon, ShoppingCartIcon } from "lucide-react";

interface RevenueCardsProps {
  revenue: {
    total: number;
    trend: number;
  };
  avgBasket: {
    value: number;
    trend: number;
  };
}

export function RevenueCards({ revenue, avgBasket }: RevenueCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTrend = (trend: number) => {
    const isPositive = trend >= 0;
    return {
      value: Math.abs(Math.round(trend)),
      isPositive,
      display: isPositive ? `+${Math.abs(Math.round(trend))}%` : `-${Math.abs(Math.round(trend))}%`,
    };
  };

  const revenueTrend = formatTrend(revenue.trend);
  const basketTrend = formatTrend(avgBasket.trend);

  return (
    <>
      {/* Revenue Total Card */}
      <Card className="relative overflow-hidden group border-none shadow-sm h-full ring-1 ring-emerald-500/10">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-600 to-emerald-800 opacity-95 transition-all duration-300 group-hover:scale-105" />
        <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-bold text-emerald-100/80 uppercase tracking-widest">
            Revenue Total
          </CardTitle>
          <div className="h-10 w-10 rounded-xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-100">
            <DollarSignIcon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-black tracking-tight text-white mb-1">
            {formatCurrency(revenue.total)}
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide",
                revenueTrend.isPositive 
                  ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/20" 
                  : "bg-rose-400/20 text-rose-200 border border-rose-400/20"
              )}
            >
              {revenueTrend.isPositive ? (
                <ArrowUpIcon className="mr-0.5 h-2.5 w-2.5" />
              ) : (
                <ArrowDownIcon className="mr-0.5 h-2.5 w-2.5" />
              )}
              {revenueTrend.display}
            </div>
            <span className="text-xs font-medium text-emerald-100/60 leading-none">
              vs période précédente
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Average Basket Card */}
      <Card className="relative overflow-hidden group border-none shadow-sm h-full ring-1 ring-indigo-500/10">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-600 to-indigo-800 opacity-95 transition-all duration-300 group-hover:scale-105" />
        <CardHeader className="relative flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-bold text-indigo-100/80 uppercase tracking-widest">
            Panier Moyen
          </CardTitle>
          <div className="h-10 w-10 rounded-xl bg-indigo-400/20 border border-indigo-400/30 flex items-center justify-center text-indigo-100">
            <ShoppingCartIcon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-black tracking-tight text-white mb-1">
            {formatCurrency(avgBasket.value)}
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide",
                basketTrend.isPositive 
                  ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/20" 
                  : "bg-rose-400/20 text-rose-200 border border-rose-400/20"
              )}
            >
              {basketTrend.isPositive ? (
                <ArrowUpIcon className="mr-0.5 h-2.5 w-2.5" />
              ) : (
                <ArrowDownIcon className="mr-0.5 h-2.5 w-2.5" />
              )}
              {basketTrend.display}
            </div>
            <span className="text-xs font-medium text-indigo-100/60 leading-none">
              vs période précédente
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
