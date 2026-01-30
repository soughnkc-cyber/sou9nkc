"use client";

import React, { useEffect, useState } from "react";
import { getAdminStats } from "@/lib/actions/dashboard";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatusDistributionPie } from "@/components/dashboard/status-distribution-pie";
import { AgentPerformanceChart } from "@/components/dashboard/agent-performance-chart";
import { TopAgentsLeaderboard } from "@/components/dashboard/avg-processing-time-card";
import { DatePickerWithRange } from "@/components/date-range-picker";
import { RevenueCards } from "@/components/dashboard/revenue-cards";
import { OrdersTrendChart } from "@/components/dashboard/orders-trend-chart";
import { OrdersByWeekdayChart } from "@/components/dashboard/orders-by-weekday-chart";
import { TopProductsChart } from "@/components/dashboard/top-products-chart";
import { PriceDistributionPie } from "@/components/dashboard/price-distribution-pie";
import { ProcessingTimeTrend } from "@/components/dashboard/processing-time-trend";
import { AgentsDetailedTable } from "@/components/dashboard/agents-detailed-table";
import { RecallTimeline } from "@/components/dashboard/recall-timeline";
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
import { DateRange } from "react-day-picker";


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();


  const fetchStats = async () => {
    setLoading(true);
    try {
      // Convert DateRange to custom range format
      const customRange = dateRange?.from && dateRange?.to ? {
        start: dateRange.from.toISOString(),
        end: dateRange.to.toISOString()
      } : undefined;
      
      // Use 'month' as default filter when no date range is selected
      const filterType = customRange ? "custom" : "month";
      
      const data = await getAdminStats(filterType, customRange);
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
  }, [hasPermission, dateRange]);




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
    <div className="flex flex-col gap-12 pb-12 bg-slate-50/20">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Vue d'ensemble</h1>
          <p className="text-slate-500 font-medium">Analyse et performance de la plateforme</p>
        </div>
        <div className="flex gap-3">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-[260px]" />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStats} 
            disabled={loading}
            className="bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-[#1F30AD] hover:border-blue-200 shadow-sm h-10 rounded-xl font-bold"
          >
            <RefreshCwIcon className={`mr-2 h-4 w-4 ${loading && "animate-spin"}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Section 1: KPI Originaux */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-1 bg-blue-600 rounded-full" />
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Statut des Commandes</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatsCard
                title="Total Commandes"
                value={stats.totalOrders}
                description="Consulter tout"
                icon={<ShoppingBagIcon className="h-5 w-5" />}
                href="/list/orders"
              />
              <StatsCard
                title="Traitées"
                value={stats.processedOrders}
                description="Succès"
                icon={<CheckCircle2Icon className="h-5 w-5" />}
                className="ring-1 ring-emerald-100"
                href="/list/orders?filter=processed"
              />
              <StatsCard
                title="À Traiter"
                value={stats.toProcessOrders}
                description="Urgent"
                icon={<AlertCircleIcon className="h-5 w-5" />}
                className="ring-1 ring-[#1F30AD]/20"
                href="/list/orders?filter=toprocess"
              />
              <StatsCard
                title="À Rappeler"
                value={stats.toRecallOrders}
                description="Planifié"
                icon={<PhoneIcon className="h-5 w-5" />}
                className="ring-1 ring-blue-100"
                href="/list/orders?filter=torecall"
              />
            </div>
          </div>
          <div>
            <StatusDistributionPie stats={stats.statusDistribution} />
          </div>
        </div>
      </div>

      {/* Section 2: Performances Agents */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-1 bg-[#1F30AD] rounded-full" />
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Productivité des Agents</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AgentPerformanceChart data={stats.agentPerformance} />
          <TopAgentsLeaderboard data={stats.agentPerformance} />
        </div>
      </div>

      {/* Section 3: Metrics Financières & Actives */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-1 bg-emerald-600 rounded-full" />
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Revenus & Efficacité</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <RevenueCards revenue={stats.revenue} avgBasket={stats.avgBasket} />
          <StatsCard
            title="Taux Traitement"
            value={`${stats.processingRate?.value ? Math.round(stats.processingRate.value) : 0}%`}
            description={`Sur ${stats.totalOrders} commandes`}
            icon={<CheckCircle2Icon className="h-5 w-5" />}
          />
          <StatsCard
            title="Agents Actifs"
            value={stats.agentCount}
            description="En ligne"
            icon={<RefreshCwIcon className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Section 4: Analyse Temporelle */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-1 bg-purple-600 rounded-full" />
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Analyses Temporelles</h2>
        </div>
        <div className="space-y-8">
          <OrdersTrendChart data={stats.orderEvolution} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <OrdersByWeekdayChart data={stats.ordersByWeekday} />
            <TopProductsChart data={stats.topProducts} />
          </div>
        </div>
      </div>

      {/* Row 6: Price Distribution & Global Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PriceDistributionPie data={stats.priceDistribution} />
        <div className="space-y-6">
          <StatsCard
            title="Temps Moyen"
            value={`${stats.avgProcessingTime} min`}
            description="Par commande"
            icon={<AlertCircleIcon className="h-5 w-5" />}
          />
          <div className="p-8 bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShoppingBagIcon className="h-24 w-24 text-white" />
             </div>
             <div className="relative">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Période Analysée</div>
                <div className="text-2xl font-black text-white">
                  {new Date(stats.dateRange.start).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long' })}
                  <span className="text-slate-500 mx-3">—</span>
                  {new Date(stats.dateRange.end).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long' })}
                </div>
                <div className="mt-6 flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Données consolidées
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Row 7: Processing Time Trend */}
      <ProcessingTimeTrend data={stats.processingTimeTrend} />

      {/* Row 8: Recall Timeline */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-1 bg-blue-400 rounded-full" />
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Agenda des Rappels</h2>
        </div>
        <RecallTimeline data={stats.recallTimeline} />
      </div>

      {/* Row 9: Detailed Agent Stats Table */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-1 bg-slate-900 rounded-full" />
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Rapport Détaillé par Agent</h2>
        </div>
        <AgentsDetailedTable data={stats.agentsDetailed} />
      </div>
    </div>
  );
   
}