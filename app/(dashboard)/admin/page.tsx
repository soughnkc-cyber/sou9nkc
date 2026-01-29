"use client";

import React, { useEffect, useState } from "react";
import { getAdminStats, DateFilterType } from "@/lib/actions/dashboard";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatusDistributionPie } from "@/components/dashboard/status-distribution-pie";
import { AgentPerformanceChart } from "@/components/dashboard/agent-performance-chart";
import { TopAgentsLeaderboard } from "@/components/dashboard/avg-processing-time-card";
import { DateFilter } from "@/components/dashboard/date-filter";
import { 
  ShoppingBagIcon, 
  CheckCircle2Icon,
  AlertCircleIcon,
  PhoneIcon,
  RefreshCwIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMe } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterType>("month");
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | undefined>();


  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getAdminStats(dateFilter, customRange);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMe().then(user => {
      if (user?.canViewDashboard) {
        setHasPermission(true);
      } else {
        setHasPermission(false);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (hasPermission) {
      fetchStats();
    }
  }, [hasPermission, dateFilter, customRange]);

  const handleDateFilterChange = (type: DateFilterType, range?: { start: string; end: string }) => {
    setDateFilter(type);
    setCustomRange(range);
  };


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
        <div className="h-96 bg-gray-100 rounded-xl"></div>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight">Tableau de Bord</h1>
          <p className="text-muted-foreground font-medium">Vue d'ensemble des commandes</p>
        </div>
        <div className="flex gap-3">
          <DateFilter value={dateFilter} onChange={handleDateFilterChange} />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStats} 
            disabled={loading}
            className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCwIcon className={`mr-2 h-4 w-4 ${loading && "animate-spin"}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Main Layout: Cards Left (50%), Pie Chart Right (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: 4 Stat Cards in 2x2 grid */}
        <div>
          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title="Total Commandes"
              value={stats.totalOrders}
              description="Toutes les commandes"
              icon={<ShoppingBagIcon className="h-5 w-5" />}
              href="/list/orders"
            />
            <StatsCard
              title="Commandes Traitées"
              value={stats.processedOrders}
              description="Avec statut"
              icon={<CheckCircle2Icon className="h-5 w-5" />}
              className="border-l-4 border-l-green-500"
              href="/list/orders?filter=processed"
            />
            <StatsCard
              title="À Traiter"
              value={stats.toProcessOrders}
              description="Sans statut"
              icon={<AlertCircleIcon className="h-5 w-5" />}
              className="border-l-4 border-l-orange-500"
              href="/list/orders?filter=toprocess"
            />
            <StatsCard
              title="À Rappeler"
              value={stats.toRecallOrders}
              description="Avec rappel programmé"
              icon={<PhoneIcon className="h-5 w-5" />}
              className="border-l-4 border-l-blue-500"
              href="/list/orders?filter=torecall"
            />
          </div>
        </div>

        {/* Right Column: Pie Chart (50%, same height as cards) */}
        <div>
          <StatusDistributionPie stats={stats.statusDistribution} />
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="text-sm font-medium text-blue-600 mb-1">Agents Actifs</div>
          <div className="text-3xl font-bold text-blue-900">{stats.agentCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Connectés au système</div>
        </div>
        <div className="p-6 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <div className="text-sm font-medium text-purple-600 mb-1">Période</div>
          <div className="text-sm font-semibold text-purple-900">
            {new Date(stats.dateRange.start).toLocaleDateString("fr-FR")}
            {" - "}
            {new Date(stats.dateRange.end).toLocaleDateString("fr-FR")}
          </div>
        </div>
      </div>

      {/* Agent Performance Row: 50/50 layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Agent Avg Processing Time Bar Chart */}
        <AgentPerformanceChart data={stats.agentPerformance} />
        
        {/* Right: Top 5 Agents Leaderboard */}
        <TopAgentsLeaderboard data={stats.agentPerformance} />
      </div>
    </div>
  );
}