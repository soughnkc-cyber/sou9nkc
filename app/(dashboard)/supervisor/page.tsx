"use client";

import React, { useEffect, useState } from "react";
import { getAdminStats } from "@/lib/actions/dashboard";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { StatusDistribution } from "@/components/dashboard/status-distribution";
import { 
  ShoppingBagIcon, 
  UsersIcon, 
  TrendingUpIcon, 
  WalletIcon,
  RefreshCwIcon,
  ShieldCheckIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMe } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";


export default function SupervisorDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);


  const fetchStats = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await getAdminStats();
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
  }, []);

  // 🔄 Auto-Refresh Polling (Every 60 seconds for Supervisor Dashboard)
  useEffect(() => {
    if (!hasPermission) return;
    
    const interval = setInterval(() => {
        fetchStats(true); // Silent background refresh
    }, 60000);

    return () => clearInterval(interval);
  }, [hasPermission]);


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


  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-end">
        {/* <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black text-blue-900 tracking-tight">Espace Superviseur</h1>
            <ShieldCheckIcon className="h-6 w-6 text-[#1F30AD]" />
          </div>
          <p className="text-muted-foreground font-medium">Vue d'ensemble de l'activité agents</p>
        </div> */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchStats()} 
          disabled={loading}
          className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <RefreshCwIcon className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* <StatsCard
          title="Commandes/Mois"
          value={stats.currentMonthOrders}
          trend={{ value: stats.ordersTrend, isPositive: stats.ordersTrend >= 0 }}
          description="vs mois dernier"
          icon={<ShoppingBagIcon className="h-5 w-5" />}
        /> */}
        {/* <StatsCard
          title="Chiffre d'Affaire"
          value={stats.revenue.toLocaleString("fr-FR", { style: "currency", currency: "MRU" })}
          trend={{ value: stats.revenueTrend, isPositive: stats.revenueTrend >= 0 }}
          description="vs mois dernier"
          icon={<WalletIcon className="h-5 w-5" />}
          className="border-l-4 border-l-[#1F30AD]"
        /> */}
        <StatsCard
          title="Total Commandes"
          value={stats.totalOrders}
          description="Volume historique"
          icon={<TrendingUpIcon className="h-5 w-5" />}
        />
        <StatsCard
          title="Agents Actifs"
          value={stats.agentCount}
          description="Connectés au système"
          icon={<UsersIcon className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <RecentOrders orders={stats.recentOrders} showAgent={true} />
        <StatusDistribution stats={stats.statusDistribution} />
      </div>
    </div>
  );
}
