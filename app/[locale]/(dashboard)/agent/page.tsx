"use client";

import React, { useEffect, useState } from "react";
import { getAgentStats } from "@/lib/actions/dashboard";
import { KPICard } from "@/components/dashboard/kpi-card";
import { DatePickerWithRange } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth } from "date-fns";
import { 
  ShoppingBagIcon, 
  DollarSignIcon, 
  TargetIcon,
  Clock,
  PhoneIncoming,
  History
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getMe } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";
import { useTranslations, useLocale } from "next-intl";
import { RevenueAreaChart, OrdersBarChart, StatusPieChart, ConfirmationRateChart } from "@/components/dashboard/charts";

export default function AgentDashboardPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const fetchStats = React.useCallback(async (isSilent = false) => {
    if (!session?.user?.id) return;
    if (!isSilent) setLoading(true);
    try {
      const data = await getAgentStats(session.user.id, dateRange?.from, dateRange?.to);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch agent stats:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [session?.user?.id, dateRange]);

  useEffect(() => {
    getMe().then(user => {
      if (user?.canViewDashboard) {
        setHasPermission(true);
      } else if (user) {
        setHasPermission(false);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (hasPermission && session?.user?.id) {
      fetchStats();
    }
  }, [hasPermission, session?.user?.id, fetchStats]);

  useEffect(() => {
    if (!hasPermission || !session?.user?.id) return;
    const interval = setInterval(() => fetchStats(true), 60000);
    return () => clearInterval(interval);
  }, [hasPermission, session?.user?.id, fetchStats]);


  if (hasPermission === false) return <PermissionDenied />;
  if (hasPermission === null || (loading && !stats)) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-6">
        <div className="h-8 w-48 bg-gray-200 rounded-md"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-2xl"></div>
      </div>
    );
  }

  if (!session?.user?.id) return null;

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-row items-center justify-between gap-2 px-1 border-b border-gray-100 pb-2 mb-2">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-blue-900 tracking-tight leading-none truncate max-w-[150px] xs:max-w-none">
            {t('welcome')}, {session.user.name}
          </h1>
        </div>
        <div className="shrink-0 scale-[0.85] sm:scale-100 origin-right translate-x-3 sm:translate-x-0">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>
      </div>

      {/* Top Section: KPIs + Status Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start mb-6">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4 items-start">
          <KPICard
            title={t('totalOrders')}
            value={stats.totalOrders}
            icon={ShoppingBagIcon}
            trend={stats.ordersTrend?.toFixed(1) + "%"}
            trendUp={stats.ordersTrend >= 0}
            bgColor="#e3f0ff"
            color="text-blue-600"
          />
          <KPICard
            title={t('processed')}
            value={stats.processedOrders}
            icon={TargetIcon}
            trend={`${Math.round(stats.processingRate?.value || 0)}%`}
            bgColor="#e3ffef"
            color="text-emerald-600"
          />
          <KPICard
            title={t('toProcess')}
            value={stats.toProcessOrders}
            icon={Clock}
            trend={stats.pendingTrend?.toFixed(1) + "%"}
            trendUp={stats.pendingTrend >= 0}
            bgColor="#fffbe3"
            color="text-yellow-600"
          />
          <KPICard
            title={t('toRecall')}
            value={stats.toRecallOrders}
            icon={PhoneIncoming}
            bgColor="#ffe3e3"
            color="text-red-600"
          />
          <KPICard
            title={t('confirmedRevenue')}
            value={stats.revenue.total.toLocaleString(locale === 'ar' ? "ar-EG" : "fr-FR", { style: "currency", currency: "MRU" })}
            icon={DollarSignIcon}
            trend={stats.confirmedRevenueTrend?.toFixed(1) + "%"}
            trendUp={stats.confirmedRevenueTrend >= 0}
            bgColor="#e3ffef"
            color="text-emerald-600"
          />
          <KPICard
            title={t('historicalVolume')}
            value={stats.historicalTotal}
            icon={History}
            bgColor="#f3f4f6"
            color="text-gray-600"
          />
        </div>
        <StatusPieChart data={stats.statusDistribution} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
         <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <RevenueAreaChart data={stats.dailyStats} />
         </div>
         <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <OrdersBarChart data={stats.dailyStats} />
         </div>
         <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <ConfirmationRateChart data={stats.dailyStats} />
         </div>
      </div>
    </div>
  );
}
