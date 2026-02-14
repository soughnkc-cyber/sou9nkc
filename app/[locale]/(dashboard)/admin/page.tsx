"use client";

import React, { useEffect, useState } from "react";
import { getAdminStats } from "@/lib/actions/dashboard";
import { KPICard } from "@/components/dashboard/kpi-card";
import { DatePickerWithRange } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth } from "date-fns";
import { 
  ShoppingBagIcon, 
  DollarSignIcon, 
  UsersIcon, 
  TargetIcon,
  Clock,
  PhoneIncoming,
  Timer
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getMe } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";
import { useTranslations } from "next-intl";

import { 
  RevenueAreaChart, 
  OrdersBarChart, 
  StatusPieChart, 
  TopProductsChart,
  ProcessingTimeChart,
  WeekdayChart,
  AgentPerformanceChart,
  AgentAvgTimeChart,
  ConfirmationRateChart
} from "@/components/dashboard/charts";

export default function AdminDashboardPage() {
  const t = useTranslations("Dashboard");
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const fetchStats = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await getAdminStats(dateRange?.from, dateRange?.to);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    getMe().then(user => {
      if (user?.canViewDashboard) {
        setHasPermission(true);
      } else if (user) {
        setHasPermission(false);
      }
    });
  }, []);

  useEffect(() => {
    if (hasPermission) {
      fetchStats();
    }
  }, [hasPermission, fetchStats]);

  // 🔄 Auto-Refresh
  useEffect(() => {
    if (!hasPermission) return;
    const interval = setInterval(() => fetchStats(true), 60000);
    return () => clearInterval(interval);
  }, [hasPermission, fetchStats]);

  if (hasPermission === false) return <PermissionDenied />;
  if (hasPermission === null || (loading && !stats)) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-6">
        <div className="flex justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded-md"></div>
          <div className="h-8 w-32 bg-gray-200 rounded-md"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
          <div className="col-span-2 bg-gray-100 rounded-2xl"></div>
          <div className="bg-gray-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2 px-1 mb-2">
        <div>
          <h1 className="text-lg sm:text-3xl font-black text-slate-900 tracking-tight leading-none">{t('overview')}</h1>
          <p className="text-gray-500 font-medium text-[9px] sm:text-[10px] mt-1 hidden xs:block">{t('consolidatedData')}</p>
        </div>
        <div className="shrink-0 scale-[0.85] sm:scale-100 origin-right translate-x-3 sm:translate-x-0">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>
      </div>

      {/* Top Section: KPIs + Status Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start mb-6">
        {/* Left: 6 KPI Cards in a Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4 items-start">
          <KPICard
            title={t('totalOrders')}
            value={stats.totalOrders}
            icon={ShoppingBagIcon}
            trend={stats.orderTrend.toFixed(1) + "%"}
            trendUp={stats.orderTrend >= 0}
            bgColor="#e3f0ff"
            color="text-blue-600"
          />
          <KPICard
            title={t('processed')}
            value={stats.processedOrders}
            icon={TargetIcon}
            trend={`${Math.round(stats.processingRate.value)}%`}
            trendUp={stats.processingRate.trend >= 0}
            bgColor="#e3ffef"
            color="text-emerald-600"
          />
          <KPICard
            title={t('toProcess')}
            value={stats.toProcessOrders}
            icon={Clock}
            trend={stats.pendingTrend.toFixed(1) + "%"}
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
            value={`${stats.confirmedRevenue.toLocaleString()} MRU`}
            icon={DollarSignIcon}
            trend={stats.confirmedRevenueTrend.toFixed(1) + "%"}
            trendUp={stats.confirmedRevenueTrend >= 0}
            bgColor="#e3ffef"
            color="text-emerald-600"
          />
          <KPICard
            title={t('avgTime')}
            value={`${stats.avgProcessingTime} min`}
            icon={Timer}
            trend={stats.avgTimeTrend.toFixed(1) + "%"}
            trendUp={stats.avgTimeTrend >= 0}
            bgColor="#f3f4f6"
            color="text-gray-600"
          />
        </div>

        {/* Right: Status Pie Chart - Using its internal ChartCard */}
        <StatusPieChart data={stats.statusDistribution} />
      </div>

      {/* Prominent Agent Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <AgentPerformanceChart data={stats.agentsDetailed} />
        <AgentAvgTimeChart data={stats.agentsDetailed} />
      </div>

      {/* Charts Grid - Target: 10 Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* 1. Revenue Area */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
           <RevenueAreaChart data={stats.dailyStats} />
        </div>
        
        {/* 2. Orders Volume (Per Agent) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
           <OrdersBarChart data={stats.agentsDetailed} />
        </div>

        {/* 3. Confirmation Rate Trend */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
           <ConfirmationRateChart data={stats.dailyStats} />
        </div>

        {/* 4. Processing Time Trend */}
         <div className="col-span-1 md:col-span-2 lg:col-span-2">
           <ProcessingTimeChart data={stats.processingTimeTrend} />
        </div>


        {/* 6. Top Products */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
           <TopProductsChart data={stats.topProducts} />
        </div>

        {/* 7. Orders by Weekday */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
           <WeekdayChart data={stats.ordersByWeekday} />
        </div>

      </div>
    </div>
  );
}
