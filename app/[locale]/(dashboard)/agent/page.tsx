"use client";

import React, { useEffect, useState } from "react";
import { getAgentStats } from "@/lib/actions/dashboard";
import { KPICard } from "@/components/dashboard/kpi-card";
import { 
  ShoppingBagIcon, 
  TrendingUpIcon, 
  WalletIcon,
  TargetIcon
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const fetchStats = async (isSilent = false) => {
    if (!session?.user?.id) return;
    if (!isSilent) setLoading(true);
    try {
      const data = await getAgentStats(session.user.id);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch agent stats:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    getMe().then(user => {
      if (user?.canViewDashboard) {
        setHasPermission(true);
        if (session?.user?.id) fetchStats();
      } else if (user) {
        setHasPermission(false);
        setLoading(false);
      }
    });
  }, [session?.user?.id]);

  useEffect(() => {
    if (!hasPermission || !session?.user?.id) return;
    const interval = setInterval(() => fetchStats(true), 60000);
    return () => clearInterval(interval);
  }, [hasPermission, session?.user?.id]);


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

  // Enhance dailyStats with rate for agent as well if needed, ensuring data exists
  const dailyStatsWithRate = stats.dailyStats?.map((d: any) => ({
      ...d,
      rate: d.orders > 0 ? Math.round(((d.revenue > 0 ? 1 : 0) / d.orders) * 100) : 0 // Rough approx if we don't have processed count in agent daily stats
      // Actually getAgentStats doesn't calculate daily processed count yet.
      // For now, let's omit ConfirmationRateChart or assume rate is 0. 
      // Better: Update getAgentStats or just use Revenue/Orders charts.
  })) || [];

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex items-center gap-2 mb-1 pb-2 border-b border-gray-100">
        <h1 className="text-2xl font-black text-blue-900 tracking-tight">{t('welcome')}, {session.user.name}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title={t('myOrdersMonth')}
          value={stats.currentMonthOrders}
          trend={stats.ordersTrend.toFixed(1) + "%"}
          trendUp={stats.ordersTrend >= 0}
          icon={ShoppingBagIcon}
          bgColor="#e3f0ff"
          color="text-blue-600"
        />
        <KPICard
          title={t('myRevenueMonth')}
          value={stats.revenue.total.toLocaleString(locale === 'ar' ? "ar-EG" : "fr-FR", { style: "currency", currency: "MRU" })}
          icon={WalletIcon}
          bgColor="#e3ffef"
          color="text-emerald-600"
        />
        <KPICard
          title={t('historicalVolume')}
          value={stats.totalOrders}
          icon={TargetIcon}
          bgColor="#f6f6f6"
          color="text-gray-600"
        />
        <KPICard
          title={t('conversionRate')}
          value={`${Math.round(stats.confirmationRate || 0)}%`} 
          icon={TrendingUpIcon}
          bgColor="#fffbe3"
          color="text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="col-span-1 md:col-span-2">
            <RevenueAreaChart data={stats.dailyStats} />
         </div>
         <div className="col-span-1 md:col-span-2">
            <OrdersBarChart data={stats.dailyStats} />
         </div>
         <div className="col-span-1">
            <StatusPieChart data={stats.statusDistribution} />
         </div>
         {/* Agent gets fewer charts naturally as they don't see team stats */}
      </div>
    </div>
  );
}
