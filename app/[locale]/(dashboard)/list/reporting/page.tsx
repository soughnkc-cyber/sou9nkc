"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getReportStats, getFilterOptions, ReportFilters } from "@/lib/actions/reporting";
import { cn } from "@/lib/utils";
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
  DownloadIcon,
  ClockIcon,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr, arSA } from "date-fns/locale";
import { getMe } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";
import { RevenueAreaChart, OrdersBarChart, TopProductsChart, StatusPieChart } from "./components/charts";
import { useTranslations, useLocale } from "next-intl";

export default function ReportingPage() {
  const t = useTranslations("Reporting");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [options, setOptions] = useState<{ agents: any[], statuses: any[], products: any[] }>({ agents: [], statuses: [], products: [] });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const [filters, setFilters] = useState<ReportFilters & { dateRange: { from: Date | undefined; to: Date | undefined } }>({
    dateRange: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    agentIds: [],
    statusIds: [],
    productIds: [],
    searchQuery: ""
  });

  const fetchOptions = useCallback(async () => {
    const data = await getFilterOptions();
    setOptions(data);
  }, []);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await getReportStats({
        startDate: filters.dateRange.from,
        endDate: filters.dateRange.to,
        agentIds: filters.agentIds,
        statusIds: filters.statusIds,
        productIds: filters.productIds,
        searchQuery: filters.searchQuery
      });
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch report stats:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    getMe().then(user => {
      if (user?.canViewReporting) {
        setHasPermission(true);
        fetchOptions();
        fetchData();
      } else {
        setHasPermission(false);
        setLoading(false);
      }
    });
  }, [fetchOptions, fetchData]);

  useEffect(() => {
    if (!hasPermission) return;
    
    const interval = setInterval(() => {
        fetchData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [hasPermission, fetchData]);

  const handleExport = () => {
    alert(t("exportAlert"));
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')}h ${m > 0 ? `${m.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')}m` : ""}`;
  };

  if (hasPermission === false) return <PermissionDenied />;
  if (hasPermission === null || (loading && !stats)) {
    return (
      <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left space-y-2">
            <div className="h-8 w-64 bg-gray-100 rounded animate-pulse mx-auto md:mx-0"></div>
            <div className="h-4 w-96 bg-gray-50 rounded animate-pulse mx-auto md:mx-0"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>)}
        </div>
        <div className="h-96 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-10">

      <div className="flex flex-col md:flex-row items-center justify-end gap-4 sm:gap-6">
        <div className="flex items-center justify-center w-full md:w-auto gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport} 
            className="h-10 rounded-xl px-3 sm:px-4 font-bold border-gray-200 hover:bg-blue-50 hover:text-[#1F30AD] hover:border-blue-200 transition-all shrink-0 text-gray-700"
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('export')}</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData()} 
            disabled={loading}
            className="h-10 rounded-xl px-3 sm:px-4 font-bold border-gray-200 text-[#1F30AD] bg-blue-50/50 hover:bg-[#1F30AD] hover:text-white hover:border-[#1F30AD] transition-all shrink-0"
          >
            <RefreshCwIcon className={cn("sm:mr-2 h-4 w-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">{t('refresh')}</span>
          </Button>
        </div>
      </div>

      <Card className="bg-white border-gray-100 shadow-xs rounded-2xl overflow-hidden">
        <CardContent className="p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('filters.search')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder={t('filters.searchPlaceholder')} 
                  className="pl-9 h-10 rounded-xl border-gray-200 bg-gray-50/30 focus-visible:ring-[#1F30AD] focus-visible:ring-offset-0 focus-visible:border-[#1F30AD] transition-all placeholder:text-gray-400 font-medium"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('filters.period')}</label>
              <DateRangePicker 
                  range={filters.dateRange} 
                  onChange={(range) => setFilters(f => ({ ...f, dateRange: range }))}
                  className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('filters.products')}</label>
              <MultiSelect 
                  options={(options.products || []).map(p => ({ label: p.name, value: p.id }))}
                  selected={filters.productIds || []}
                  onChange={(ids) => setFilters(f => ({ ...f, productIds: ids }))}
                  placeholder={t('filters.allProducts')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('filters.agents')}</label>
              <MultiSelect 
                  options={options.agents.map(a => ({ label: a.name || a.id, value: a.id }))}
                  selected={filters.agentIds || []}
                  onChange={(ids) => setFilters(f => ({ ...f, agentIds: ids }))}
                  placeholder={t('filters.allAgents')}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('filters.statuses')}</label>
              <MultiSelect 
                  options={options.statuses.map(s => ({ label: s.name, value: s.id }))}
                  selected={filters.statusIds || []}
                  onChange={(ids) => setFilters(f => ({ ...f, statusIds: ids }))}
                  placeholder={t('filters.allStatuses')}
              />
            </div>
            <div className="flex items-end md:col-span-2">
                <p className="text-[10px] text-gray-400 font-medium italic">{t('filters.autoUpdate')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && !stats ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-gray-100 rounded-xl"></div>
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard
              title={t('stats.totalRevenue')}
              value={stats.totalRevenue.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR', { style: "currency", currency: "MRU" })}
              description={t('stats.volumePeriod')}
              icon={<WalletIcon className="h-5 w-5" />}
              className="bg-[#1F30AD] text-white border-none shadow-blue-100 shadow-lg"
            />
            <StatsCard
              title={t('stats.orders')}
              value={stats.totalOrders.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')}
              description={t('stats.processedTransactions')}
              icon={<ShoppingBagIcon className="h-5 w-5" />}
            />
            <StatsCard
              title={t('stats.conversion')}
              value={`${Math.round(stats.agentPerformance.reduce((acc: number, curr: any) => acc + curr.conversionRate, 0) / (stats.agentPerformance.length || 1)).toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')}%`}
              description={t('stats.globalAvgRate')}
              icon={<TargetIcon className="h-5 w-5" />}
            />
            <StatsCard
              title={t('stats.delay')}
              value={formatDuration(stats.averageProcessingTime)}
              description={t('stats.avgTime')}
              icon={<ClockIcon className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            <RevenueAreaChart data={stats.dailyStats} />
            <OrdersBarChart data={stats.dailyStats} />
            <TopProductsChart data={stats.productPerformance} />
            <StatusPieChart data={stats.statusDistribution} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            <Card className="col-span-full border border-gray-100 shadow-xs bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                  <UsersIcon className="mr-2 h-4 w-4 text-[#1F30AD]" />
                  {t('agentPerformance.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase font-black text-gray-400 border-b bg-gray-50/30">
                      <tr>
                        <th className="px-6 py-4">{t('agentPerformance.colAgent')}</th>
                        <th className="px-6 py-4 text-center">{t('agentPerformance.colCmd')}</th>
                        <th className="px-6 py-4 text-center">{t('agentPerformance.colOk')}</th>
                        <th className="px-6 py-4 text-center">{t('agentPerformance.colCv')}</th>
                        <th className="px-6 py-4 text-right">{t('agentPerformance.colRevenue')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.agentPerformance.map((agent: any) => (
                        <tr key={agent.agentId} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{agent.agentName}</td>
                          <td className="px-6 py-4 text-center font-medium">{agent.totalOrders.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')}</td>
                          <td className="px-6 py-4 text-center text-green-600 font-bold">{agent.confirmedOrders.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                                <span className="font-extrabold text-[#1F30AD]">{agent.conversionRate.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR')}%</span>
                                <div className="hidden sm:block w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="bg-[#1F30AD] h-full" style={{ width: `${agent.conversionRate}%` }} />
                                </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-gray-900 whitespace-nowrap">
                            {agent.totalRevenue.toLocaleString(locale === 'ar' ? 'ar-EG' : 'fr-FR', { style: "currency", currency: "MRU" })}
                          </td>
                        </tr>
                      ))}
                      {stats.agentPerformance.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic">
                            {t('agentPerformance.noData')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
