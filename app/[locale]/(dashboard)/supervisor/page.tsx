"use client";

import React, { useEffect, useState } from "react";
import { getAdminStats } from "@/lib/actions/dashboard";
import { KPICard } from "@/components/dashboard/kpi-card";
import { 
  TrendingUpIcon, 
  UsersIcon, 
  ShoppingBagIcon,
  CheckCircle2Icon
} from "lucide-react";
import { getMe } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";
import { useTranslations } from "next-intl";
import { 
  RevenueAreaChart, 
  OrdersBarChart, 
  StatusPieChart, 
  ProcessingTimeChart,
  AgentPerformanceChart,
  ConfirmationRateChart,
  WeekdayChart
} from "@/components/dashboard/charts";


import { DateFilter, DateFilterType } from "@/components/dashboard/date-filter";

export default function SupervisorDashboardPage() {
  const t = useTranslations("Dashboard");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<DateFilterType>("month");
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date } | undefined>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const fetchStats = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const range = customRange ? { start: customRange.start.toISOString(), end: customRange.end.toISOString() } : undefined;
      const data = await getAdminStats(filterType, range);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch supervisor stats:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    getMe().then(user => {
      if (user?.canViewDashboard) {
        setHasPermission(true);
        fetchStats();
      } else {
        setHasPermission(false);
        setLoading(false);
      }
    });
  }, [filterType, customRange]);

  useEffect(() => {
    if (!hasPermission) return;
    const interval = setInterval(() => fetchStats(true), 60000);
    return () => clearInterval(interval);
  }, [hasPermission]);


  if (hasPermission === false) return <PermissionDenied />;
  if (hasPermission === null || (loading && !stats)) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-6">
        <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-gray-200 rounded-md"></div>
            <div className="h-8 w-32 bg-gray-200 rounded-md"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-2xl"></div>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('supervisorView')}</h1>
          <p className="text-muted-foreground font-medium">{t('welcomeBack')}</p>
        </div>
        <DateFilter 
          value={filterType} 
          onChange={(type, range) => {
            setFilterType(type);
            if (range) {
              setCustomRange({ 
                start: new Date(range.start), 
                end: new Date(range.end) 
              });
            }
          }} 
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title={t('totalOrders')}
          value={stats.totalOrders}
          icon={ShoppingBagIcon}
          bgColor="#e3f0ff"
          color="text-blue-600"
        />
        <KPICard
          title={t('processed')}
          value={stats.processedOrders}
          icon={CheckCircle2Icon}
          bgColor="#e3ffef"
          color="text-emerald-600"
        />
        <KPICard
          title={t('activeAgents')}
          value={stats.agentCount}
          icon={UsersIcon}
          bgColor="#f6f6f6"
          color="text-gray-600"
        />
        <KPICard
          title={t('conversionRate')}
          value={`${stats.processingRate?.value ? Math.round(stats.processingRate.value) : 0}%`}
          icon={TrendingUpIcon}
          bgColor="#fffbe3"
          color="text-yellow-600"
          trend={stats.processingRate?.trend?.toFixed(1) + "%"}
          trendUp={stats.processingRate?.trend >= 0}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <OrdersBarChart data={stats.dailyStats} />
        </div>
        <div className="col-span-1">
            <StatusPieChart data={stats.statusDistribution} />
        </div>
        <div className="col-span-1 md:col-span-2">
            <AgentPerformanceChart data={stats.agentsDetailed} />
        </div>
        <div className="col-span-1">
            <WeekdayChart data={stats.ordersByWeekday} />
        </div>
         <div className="col-span-1 md:col-span-2 lg:col-span-3">
           <ProcessingTimeChart data={stats.processingTimeTrend} />
        </div>
      </div>
    </div>
  );
}
