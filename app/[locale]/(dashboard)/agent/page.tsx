"use client";

import React, { useEffect, useState } from "react";
import { getAgentStats } from "@/lib/actions/dashboard";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { StatusDistribution } from "@/components/dashboard/status-distribution";
import { 
  ShoppingBagIcon, 
  TrendingUpIcon, 
  WalletIcon,
  UserIcon,
  TargetIcon
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getMe } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";
import { useTranslations, useLocale } from "next-intl";

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

  // 🔄 Auto-Refresh Polling (Every 60 seconds for Agent Dashboard)
  useEffect(() => {
    if (!hasPermission || !session?.user?.id) return;
    
    const interval = setInterval(() => {
        fetchStats(true); // Silent background refresh
    }, 60000);

    return () => clearInterval(interval);
  }, [hasPermission, session?.user?.id]);


  if (hasPermission === false) return <PermissionDenied />;
  if (hasPermission === null || (loading && !stats)) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-gray-200 rounded-md mb-2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mt-6">
          <div className="col-span-4 h-96 bg-gray-100 rounded-xl"></div>
          <div className="col-span-3 h-96 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }


  if (!session?.user?.id) {
    return <div className="p-8 text-center text-gray-500">{t('loading')}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black text-blue-900 tracking-tight">{t('welcome')}, {session.user.name || t('agent')} !</h1>
            <UserIcon className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-muted-foreground font-medium">{t('agentSpace')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t('myOrdersMonth')}
          value={stats.currentMonthOrders}
          trend={{ value: stats.ordersTrend, isPositive: stats.ordersTrend >= 0 }}
          description={t('vsLastMonth')}
          icon={<ShoppingBagIcon className="h-5 w-5" />}
        />
        <StatsCard
          title={t('myRevenueMonth')}
          value={stats.revenue.toLocaleString(locale === 'ar' ? "ar-EG" : "fr-FR", { style: "currency", currency: "MRU" })}
          description={t('potentialCommission')}
          icon={<WalletIcon className="h-5 w-5" />}
          className="border-l-4 border-l-[#1F30AD]"
        />
        <StatsCard
          title={t('historicalVolume')}
          value={stats.totalOrders}
          description={t('overview')}
          icon={<TargetIcon className="h-5 w-5" />}
        />
        <StatsCard
          title={t('conversionRate')}
          value="..." 
          description={t('loading')}
          icon={<TrendingUpIcon className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <RecentOrders orders={stats.recentOrders} showAgent={false} />
        <StatusDistribution stats={stats.statusDistribution} />
      </div>
    </div>
  );
}
