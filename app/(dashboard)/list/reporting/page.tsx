"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getReportStats, getFilterOptions, ReportFilters } from "@/lib/actions/reporting";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatusDistribution } from "@/components/dashboard/status-distribution";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { MultiSelect } from "@/components/dashboard/multi-select";
import { 
  ShoppingBagIcon, 
  WalletIcon, 
  RefreshCwIcon,
  FileBarChart2Icon,
  UsersIcon,
  TargetIcon,
  DownloadIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

export default function ReportingPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [options, setOptions] = useState<{ agents: any[], statuses: any[] }>({ agents: [], statuses: [] });
  
  const [filters, setFilters] = useState<ReportFilters & { dateRange: { from: Date | undefined; to: Date | undefined } }>({
    dateRange: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    agentIds: [],
    statusIds: []
  });

  const fetchOptions = useCallback(async () => {
    const data = await getFilterOptions();
    setOptions(data);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReportStats({
        startDate: filters.dateRange.from,
        endDate: filters.dateRange.to,
        agentIds: filters.agentIds,
        statusIds: filters.statusIds
      });
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch report stats:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    // Simple mock export
    alert("Fonctionnalité d'exportation CSV en cours de développement.");
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight flex items-center gap-2">
            <FileBarChart2Icon className="h-8 w-8 text-blue-600" />
            Reporting & Analytics
          </h1>
          <p className="text-muted-foreground font-medium">Analyse détaillée des performances de la plateforme</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={handleExport} className="bg-white border-blue-200">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData} 
            disabled={loading}
            className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCwIcon className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="bg-white border-blue-100 shadow-sm">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-blue-400 tracking-widest">Période</label>
            <DateRangePicker 
                range={filters.dateRange} 
                onChange={(range) => setFilters(f => ({ ...f, dateRange: range }))}
                className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-blue-400 tracking-widest">Agents</label>
            <MultiSelect 
                options={options.agents.map(a => ({ label: a.name || a.id, value: a.id }))}
                selected={filters.agentIds || []}
                onChange={(ids) => setFilters(f => ({ ...f, agentIds: ids }))}
                placeholder="Tous les agents"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-blue-400 tracking-widest">Statuts</label>
            <MultiSelect 
                options={options.statuses.map(s => ({ label: s.name, value: s.id }))}
                selected={filters.statusIds || []}
                onChange={(ids) => setFilters(f => ({ ...f, statusIds: ids }))}
                placeholder="Tous les statuts"
            />
          </div>
        </CardContent>
      </Card>

      {loading && !stats ? (
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-gray-100 rounded-xl"></div>
        </div>
      ) : stats && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="Ventes Totales"
              value={stats.totalRevenue.toLocaleString("fr-FR", { style: "currency", currency: "MRU" })}
              description={`Volume généré sur la période`}
              icon={<WalletIcon className="h-5 w-5" />}
              className="bg-blue-600 text-white border-none shadow-blue-200 shadow-lg"
            />
            <StatsCard
              title="Volume de Commandes"
              value={stats.totalOrders}
              description="Nombre de transactions traitées"
              icon={<ShoppingBagIcon className="h-5 w-5" />}
            />
            <StatsCard
              title="Conversion Moyenne"
              value={`${Math.round(stats.agentPerformance.reduce((acc: number, curr: any) => acc + curr.conversionRate, 0) / (stats.agentPerformance.length || 1))}%`}
              description="Taux global sur la période"
              icon={<TargetIcon className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mt-2">
            {/* Agent Performance Table */}
            <Card className="col-span-full lg:col-span-5 border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b">
                <CardTitle className="text-xl font-bold flex items-center text-blue-900">
                  <UsersIcon className="mr-2 h-5 w-5 text-blue-600" />
                  Performance des Agents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase font-bold text-gray-400 border-b bg-gray-50/30">
                      <tr>
                        <th className="px-6 py-4">Agent</th>
                        <th className="px-6 py-4 text-center">Commandes</th>
                        <th className="px-6 py-4 text-center">Confirmées</th>
                        <th className="px-6 py-4 text-center">Conversion</th>
                        <th className="px-6 py-4 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.agentPerformance.map((agent: any) => (
                        <tr key={agent.agentId} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-blue-900">{agent.agentName}</td>
                          <td className="px-6 py-4 text-center font-medium">{agent.totalOrders}</td>
                          <td className="px-6 py-4 text-center text-green-600 font-bold">{agent.confirmedOrders}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                                <span className="font-black text-blue-600">{agent.conversionRate}%</span>
                                <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{ width: `${agent.conversionRate}%` }} />
                                </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-blue-900">
                            {agent.totalRevenue.toLocaleString("fr-FR", { style: "currency", currency: "MRU" })}
                          </td>
                        </tr>
                      ))}
                      {stats.agentPerformance.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic">
                            Aucune donnée disponible pour cette sélection.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="col-span-full lg:col-span-2">
                <StatusDistribution stats={stats.statusDistribution} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";