"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

import { DataTable } from "@/components/datatable";
import { getColumns, Order } from "./columns";
import { Button } from "@/components/ui/button";
import { RefreshCw, PhoneIncoming, ShoppingCart, DollarSign, Target, Clock, Trash2, Edit } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

/* Actions */
import { getOrders, updateOrderRecallAt, updateOrderAgent, deleteOrders, bulkUpdateOrders } from "@/lib/actions/orders";
import { getStatus, updateOrderStatus } from "@/lib/actions/status";
import { getMe, getAgents } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";


import { DatePickerWithRange } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, isWithinInterval, startOfWeek, endOfWeek, subDays } from "date-fns";

import { AgentAssignmentModal } from "@/components/forms/agent-assignment-modal";
import { AgentAssignmentData } from "@/components/forms/agent-assignment-form";
import { BulkEditModal } from "@/components/forms/bulk-edit-modal";

function OrdersPageContent() {
  const session = useSession();
  const t = useTranslations('Orders');
  const locale = useLocale();

  // --------------------
  // Hooks
  // --------------------
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string; color?: string; isActive?: boolean; etat: string }[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string; isActive: boolean; role: string; iconColor?: string }[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6), 
    to: new Date(),
  });
  const [tableFilteredOrders, setTableFilteredOrders] = useState<Order[]>([]);
  const [lastServerTime, setLastServerTime] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false); 
  const user = session.data?.user;
  const isAdmin = user?.role === "ADMIN";
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, { statusId?: string | null, recallAt?: string | null }>>({});

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean; order: Order | null }>({
    isOpen: false,
    order: null,
  });
  const [isAssigning, setIsAssigning] = useState(false);

  // Helper to check if current view is mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Read URL query params for filtering
  const searchParams = useSearchParams();
  const filterType = searchParams.get("filter"); 

  useEffect(() => {
    if (session.status === "unauthenticated") {
      redirect("/auth/signin");
    }
  }, [session.status]);

  useEffect(() => {
    getMe().then(user => {
      if (user?.canViewOrders) {
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
    });
  }, []);


  const fetchStatusesAndAgents = useCallback(async () => {
    try {
      const [statusData, agentData] = await Promise.all([
        getStatus(),
        getAgents()
      ]);
      setStatuses(statusData as any); 
      setAgents(agentData);
    } catch (error) {
      console.error(error);
      toast.error(t('errorLoadingAux'));
    }
  }, [t]);

  const handleStatusChange = async (orderId: string, statusId: string | null) => {
    const status = statuses.find(s => s.id === statusId);
    
    if (isMobile && status?.etat === 'STATUS_14') {
      setPendingUpdates(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], statusId }
      }));
      return;
    }

    if (pendingUpdates[orderId]) {
      setPendingUpdates(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }

    try {
      const updated = await updateOrderStatus(orderId, statusId);
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId ? { 
            ...o, 
            status: updated.status, 
            recallAt: updated.recallAt,
            recallAttempts: updated.recallAttempts,
            processingTimeMin: updated.processingTimeMin,
            absoluteDelayMin: updated.absoluteDelayMin
          } : o
        )
      );
      toast.success(t('statusUpdated'));
    } catch (error: any) {
      toast.error(error.message || t('errorStatusUpdate'));
    }
  };

  const handleAgentChange = async (orderId: string, agentId: string) => {
    try {
      const updated = await updateOrderAgent(orderId, agentId);
      setOrders(prev =>
        prev.map(o => 
            o.id === orderId ? { ...o, agent: updated.agent } : o
        )
      );
      toast.success(t('agentReassigned'));
    } catch (e) {
      console.error(e);
      toast.error(t('errorReassign'));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedOrders.length === 0) return;
    if (!window.confirm(t('confirmDelete', { count: selectedOrders.length }))) return;

    try {
      await deleteOrders(selectedOrders.map(o => o.id));
      toast.success(t('successDelete'));
      setSelectedOrders([]);
      refreshData();
    } catch (error) {
      console.error(error);
      toast.error(t('errorDelete'));
    }
  };

  const handleRecallChange = async (orderId: string, value: string | null) => {
    const order = orders.find(o => o.id === orderId);
    const pending = pendingUpdates[orderId];
    
    const effectiveStatusEtat = pending?.statusId !== undefined 
      ? statuses.find(s => s.id === pending.statusId)?.etat
      : order?.status?.etat;

    if (isMobile && effectiveStatusEtat === 'STATUS_14') {
      setPendingUpdates(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], recallAt: value }
      }));
      return;
    }

    try {
      const date = value ? new Date(value) : null;
      const updated = await updateOrderRecallAt(orderId, date);
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, recallAt: updated.recallAt } : o))
      );
      toast.success(t('recallUpdated'));
    } catch {
      toast.error(t('errorRecallUpdate'));
    }
  };

  const handleSaveMobileUpdates = async (orderId: string) => {
    const pending = pendingUpdates[orderId];
    if (!pending) return;

    let recallAtValue: Date | null | undefined = undefined;
    if (pending.recallAt !== undefined) {
      recallAtValue = pending.recallAt ? new Date(pending.recallAt) : null;
    }

    try {
      setIsLoadingPage(true);
      const res = await bulkUpdateOrders([orderId], {
        statusId: pending.statusId,
        recallAt: recallAtValue
      });

      if (res.success) {
        toast.success(t('bulkEditSuccess'));
        setPendingUpdates(prev => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        refreshData(true);
      }
    } catch (error: any) {
      toast.error(error.message || t('errorUpdate'));
    } finally {
      setIsLoadingPage(false);
    }
  };

  const handleBulkUpdate = async (updates: { agentId?: string; statusId?: string | null; recallAt?: string | null }) => {
    try {
      setIsBulkUpdating(true);
      const selectedIds = selectedOrders.map(o => o.id);
      
      const res = await bulkUpdateOrders(selectedIds, {
        agentId: updates.agentId,
        statusId: updates.statusId,
        recallAt: updates.recallAt ? new Date(updates.recallAt) : (updates.recallAt === null ? null : undefined)
      });
      
      if (res.success) {
        toast.success(t('bulkEditSuccess'));
        setSelectedOrders([]);
        setIsBulkModalOpen(false);
        refreshData(true);
      }
    } catch (error: any) {
      toast.error(error.message || t('errorUpdate'));
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const closeAssignModal = () => {
    setAssignModal({ isOpen: false, order: null });
  };

  const handleAssignmentSubmit = async (data: AgentAssignmentData) => {
    if (!assignModal.order) return;
    setIsAssigning(true);
    try {
      await handleAgentChange(assignModal.order.id, data.agentId);
      closeAssignModal();
    } finally {
      setIsAssigning(false);
    }
  };

  const refreshData = useCallback(async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setIsLoadingPage(true);
    try {
      const response = await getOrders();
      setOrders(response.orders);
      setLastServerTime(response.serverTime);
    } catch (error) {
      console.error(error);
      if (!isSilent) toast.error(t('errorRefresh'));
    } finally {
      if (!isSilent) setIsLoadingPage(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (hasPermission) {
      refreshData(); 
      fetchStatusesAndAgents();
    }
  }, [hasPermission, refreshData, fetchStatusesAndAgents]);

  useEffect(() => {
    if (!hasPermission || !user) return;
    
    if (isPaused) { 
        return; 
    }
    
    const interval = setInterval(() => {
        refreshData(true); 
    }, 30000);

    return () => clearInterval(interval);
  }, [hasPermission, user, refreshData, isPaused]);

  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [recallFilterEntryTime, setRecallFilterEntryTime] = useState<Date | null>(null);

  useEffect(() => {
    const activeFilter = currentFilter || filterType;
    if (activeFilter === "torecall") {
        if (!recallFilterEntryTime && lastServerTime) {
            const entryTime = new Date(lastServerTime);
            setRecallFilterEntryTime(entryTime);
        }
    } else if (activeFilter !== "new_arrivals") {
        setRecallFilterEntryTime(null);
    }
  }, [currentFilter, filterType, recallFilterEntryTime, lastServerTime]);

  const dateFilteredOrders = useMemo(() => {
    let result = orders;
    if (dateRange?.from) {
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        result = result.filter(order => {
            const date = new Date(order.orderDate);
            return isWithinInterval(date, { start: from, end: to });
        });
    }
    return result;
  }, [orders, dateRange]);

  const filteredOrders = useMemo(() => {
    const activeFilter = currentFilter || filterType;
    if (!activeFilter || activeFilter === "all") return dateFilteredOrders;
    
    switch (activeFilter) {
      case "processed":
        return dateFilteredOrders.filter(order => order.status !== null && order.status !== undefined);
      case "toprocess":
        return dateFilteredOrders.filter(order => !order.status);
      case "torecall":
        return orders.filter(o => o.recallAt && new Date(o.recallAt) <= new Date());
      case "new_arrivals":
        return dateFilteredOrders.filter(o => 
            !o.status && 
            recallFilterEntryTime && 
            new Date(o.createdAt) >= recallFilterEntryTime
        );
      default:
        return dateFilteredOrders;
    }
  }, [dateFilteredOrders, filterType, currentFilter, recallFilterEntryTime, orders]);
  
  const categoryOnlyFilteredOrders = useMemo(() => {
    const activeFilter = currentFilter || filterType;
    if (!activeFilter || activeFilter === "all") return orders;
    
    switch (activeFilter) {
      case "processed":
        return orders.filter(order => order.status !== null && order.status !== undefined);
      case "toprocess":
        return orders.filter(order => !order.status);
      case "torecall":
        return orders.filter(o => o.recallAt && new Date(o.recallAt) <= new Date());
      case "new_arrivals":
        return orders.filter(o => 
            !o.status && 
            recallFilterEntryTime && 
            new Date(o.createdAt) >= recallFilterEntryTime
        );
      default:
        return orders;
    }
  }, [orders, filterType, currentFilter, recallFilterEntryTime]);

  const stats = useMemo(() => {
    const base = tableFilteredOrders;
    
    const calculateStats = (orderSet: Order[]) => {
      const total = orderSet.length;
      
      const ordersWithStatus = orderSet.filter(o => o.status?.id || o.status?.name);
      const confirmedOrders = orderSet.filter(o => {
        const status = o.status as any;
        if (!status) return false;
        
        const etatValue = status.etat?.toString() || "";
        const nameValue = status.name?.toString() || "";
        
        return (
          etatValue.toUpperCase() === 'STATUS_15' || 
          nameValue.toUpperCase().includes('STATUS_15')
        );
      });

      const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
      const treatmentRate = ordersWithStatus.length > 0 ? (confirmedOrders.length / ordersWithStatus.length) * 100 : 0;
      
      const ordersWithDuration = orderSet.filter(o => o.processingTimeMin != null && o.processingTimeMin > 0);
      const avgDuration = ordersWithDuration.length > 0 
        ? ordersWithDuration.reduce((sum, o) => sum + (o.processingTimeMin || 0), 0) / ordersWithDuration.length 
        : 0;

      const newOrdersCount = orderSet.filter(o => {
          if (!recallFilterEntryTime || o.status) return false;
          const oTime = new Date(o.createdAt).getTime();
          const eTime = recallFilterEntryTime.getTime();
          return oTime >= eTime;
      }).length;

      return { total, totalRevenue, treatmentRate, avgDuration, newOrdersCount };
    };

    const currentStats = calculateStats(base);
    
    const recallDue = categoryOnlyFilteredOrders.filter(o => 
      o.recallAt && new Date(o.recallAt) <= new Date()
    ).length;
    
    let previousStats = { total: 0, totalRevenue: 0, treatmentRate: 0, avgDuration: 0 };
    
    if (dateRange?.from) {
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      const periodDuration = to.getTime() - from.getTime();
      const previousFrom = new Date(from.getTime() - periodDuration);
      const previousTo = new Date(from.getTime() - 1);
      
      const previousPeriodOrders = orders.filter(order => {
        const date = new Date(order.orderDate);
        return isWithinInterval(date, { start: previousFrom, end: previousTo });
      });
      
      const p = calculateStats(previousPeriodOrders);
      previousStats = { ...p };
    }
    
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { trend: current > 0 ? "100%" : "0%", trendUp: current > 0 };
      const change = ((current - previous) / previous) * 100;
      return {
        trend: `${Math.abs(change).toFixed(1)}%`,
        trendUp: change >= 0
      };
    };

    const totalTrend = calculateTrend(currentStats.total, previousStats.total);
    const revenueTrend = calculateTrend(currentStats.totalRevenue, previousStats.totalRevenue);
    const treatmentRateTrend = calculateTrend(currentStats.treatmentRate, previousStats.treatmentRate);
    const avgDurationTrend = calculateTrend(currentStats.avgDuration, previousStats.avgDuration);
    
    return {
      total: currentStats.total,
      totalRevenue: currentStats.totalRevenue,
      recallToday: recallDue, 
      treatmentRate: currentStats.treatmentRate,
      avgDuration: currentStats.avgDuration,
      newOrdersCount: currentStats.newOrdersCount,
      // Trends
      totalTrend: totalTrend.trend,
      totalTrendUp: totalTrend.trendUp,
      revenueTrend: revenueTrend.trend,
      revenueTrendUp: revenueTrend.trendUp,
      treatmentRateTrend: treatmentRateTrend.trend,
      treatmentRateTrendUp: treatmentRateTrend.trendUp,
      avgDurationTrend: avgDurationTrend.trend,
      avgDurationTrendUp: !avgDurationTrend.trendUp, 
    };
  }, [tableFilteredOrders, recallFilterEntryTime, orders, dateRange, categoryOnlyFilteredOrders]);

  const StatCard = ({ title, value, icon: Icon, active, onClick, color, trend, trendUp, isClickable = true, bgColor }: any) => {
    return (
      <Card
        onClick={() => isClickable && onClick?.()}
        style={{ backgroundColor: bgColor }}
        className={cn(
          "relative p-3 sm:p-4 border-none shadow-none rounded-2xl overflow-hidden flex flex-col h-full min-h-[80px] gap-1",
          isClickable ? "cursor-pointer transition-all duration-300 hover:brightness-95 active:scale-95" : "cursor-default"
        )}
      >
      <div className="flex justify-between items-start mb-0">
        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest opacity-80">{title}</p>
        
        {active && (
           <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[#1F30AD]" />
        )}
      </div>
      
      <div className="flex justify-between items-end mt-1">
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">{value}</h3>
         {(trendUp !== undefined && trend !== undefined) && (
            <div className={cn(
              "px-1.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1",
              trendUp ? "bg-white/50 text-green-700" : "bg-white/50 text-red-700"
            )}>
               {trendUp ? "↑" : "↓"} {trend}
            </div>
         )}
      </div>
    </Card>
  ); };

  const productOptions = useMemo(() => {
     const notes = new Set(filteredOrders.map(o => o.productNote).filter(Boolean) as string[]);
     return Array.from(notes);
  }, [filteredOrders]);

  const priceOptions = useMemo(() => {
     const prices = new Set(filteredOrders.map(o => o.totalPrice));
     return Array.from(prices).sort((a, b) => a - b);
  }, [filteredOrders]);


  const columns = useMemo(() => {
    const canEdit = !!(user as any)?.canEditOrders || user?.role === "ADMIN" || user?.role === "SUPERVISOR";
    
    return getColumns(
        user?.role, 
        canEdit, 
        statuses, 
        agents, 
        productOptions,
        priceOptions, 
        handleStatusChange, 
        handleAgentChange, 
        handleRecallChange,
        t,
        locale,
        undefined, 
        undefined, 
        undefined, 
        () => setIsPaused(true), 
        () => setIsPaused(false), 
        pendingUpdates
    );
  }, [statuses, agents, productOptions, priceOptions, user?.role, (user as any)?.canEditOrders, handleStatusChange, handleAgentChange, handleRecallChange, pendingUpdates, t, locale]);

  const toggleFilter = (filter: string) => {
    setCurrentFilter(prev => prev === filter ? null : filter);
  };


  if (session.status === "loading" || hasPermission === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (hasPermission === false) {
    return <PermissionDenied />;
  }


  return (
    <div className="space-y-2 sm:space-y-2 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-end items-center md:items-center gap-4 sm:gap-6">
      </div>

      <div className="flex flex-col gap-2 sm:gap-4 -mt-2 sm:mt-0">
        
        <div className="w-full">
            {(currentFilter === "torecall" || filterType === "torecall" || currentFilter === "new_arrivals") ? (
              <StatCard
                title={t('newArrivals')}
                value={stats.newOrdersCount}
                icon={RefreshCw}
                active={currentFilter === "new_arrivals"}
                onClick={() => toggleFilter(currentFilter === "new_arrivals" ? "torecall" : "new_arrivals")}
                color="bg-purple-500/10 text-purple-600"
                bgColor="#f9e3ff"
                trend="Live"
                trendUp={true}
              />
            ) : (
               <StatCard
                title={t('toRecall')}
                value={stats.recallToday.toLocaleString("fr-FR")}
                icon={PhoneIncoming}
                active={currentFilter === "torecall" || filterType === "torecall"}
                onClick={() => toggleFilter("torecall")}
                color="bg-red-500/10 text-red-600"
                bgColor="#ffe3e3"
              />
            )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <StatCard
              title={t('totalOrders')}
              value={stats.total.toLocaleString("fr-FR")}
              icon={ShoppingCart}
              active={currentFilter === "all" && filterType === null}
              onClick={() => toggleFilter("all")}
              color="bg-blue-500/10 text-blue-600"
              bgColor="#e3f0ff"
              trend={stats.totalTrend}
              trendUp={stats.totalTrendUp}
            />

            <StatCard
              title={t('totalRevenue')}
              value={`${stats.totalRevenue.toLocaleString("fr-FR")} MRU`}
              icon={DollarSign}
              active={false}
              onClick={() => {}}
              color="bg-emerald-500/10 text-emerald-600"
              bgColor="#e3ffef"
              trend={stats.revenueTrend}
              trendUp={stats.revenueTrendUp}
            />

            <StatCard
              title={t('confirmationRate')}
              value={`${(stats.treatmentRate || 0).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
              icon={Target}
              active={false}
              color="bg-yellow-500/10 text-yellow-600"
              bgColor="#fffbe3"
              trend={stats.treatmentRateTrend}
              trendUp={stats.treatmentRateTrendUp}
            />

            <StatCard
              title={t('avgCallTime')}
              value={`${Math.round(stats.avgDuration).toLocaleString("fr-FR")} min`}
              icon={Clock}
              active={false}
              onClick={() => {}}
              color="bg-gray-500/10 text-gray-600"
              bgColor="#f6f6f6"
              trend={stats.avgDurationTrend}
              trendUp={stats.avgDurationTrendUp}
            />
        </div>
      </div>

      <div className="space-y-4">
        
        <div className="bg-white rounded-3xl p-2 border border-gray-100 shadow-sm">
          <DataTable<Order, unknown>
            columns={columns}
            data={filteredOrders}
            searchPlaceholder={t('searchPlaceholder')}
            pageSizeOptions={[10, 20, 50]}
            defaultPageSize={50}
            showSearch
            showPagination
            rightHeaderActions={
              <div className="flex items-center gap-2">


                  {selectedOrders.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsBulkModalOpen(true)}
                      className="h-9 rounded-xl font-bold border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{t('edit')} ({selectedOrders.length.toLocaleString("fr-FR")})</span>
                      <span className="sm:hidden">({selectedOrders.length.toLocaleString("fr-FR")})</span>
                    </Button>
                  )}
                  
                  {isAdmin && selectedOrders.length > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleDeleteSelected} 
                      className="h-9 rounded-xl font-bold shadow-sm shadow-red-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{t('delete')}</span>
                      <span className="bg-white/20 px-1 rounded-md ml-1">{selectedOrders.length.toLocaleString("fr-FR")}</span>
                    </Button>
                  )}

                  <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              </div>
            }
            onSelectionChange={setSelectedOrders}
            onFilteredDataChange={setTableFilteredOrders}
            getRowClassName={(row) => {
               const recallAt = row.recallAt ? new Date(row.recallAt) : null;
               if (recallAt && isPast(recallAt)) {
                 return "border border-red-500 shadow-sm shadow-red-100";
               }
               return "";
            }}
            mobileRowAction={(row) => {
               const hasRecallAlert = row.recallAt && isPast(new Date(row.recallAt));
               if (!hasRecallAlert) return null;
               return (
                 <div className="bg-red-600 rounded-full p-1.5 shadow-sm animate-pulse">
                   <Clock className="h-3.5 w-3.5 text-white" />
                 </div>
               );
            }}
            mobileExpandedAction={(row) => {
               const pending = pendingUpdates[row.id];
               const effectiveStatusId = pending?.statusId !== undefined ? pending.statusId : row.status?.id;
               const effectiveStatus = statuses.find(s => s.id === effectiveStatusId);
               const isStatus14 = effectiveStatus?.etat === 'STATUS_14';
               
               const canClick = !!pending && isStatus14;

               return (
                  <Button
                    size="sm"
                    className={cn(
                      "h-8 px-4 font-bold rounded-lg shadow-sm transition-all",
                      canClick 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canClick) handleSaveMobileUpdates(row.id);
                    }}
                    disabled={!canClick || isLoadingPage}
                  >
                    OK
                  </Button>
               );
            }}
            extraSearchActions={null}
          />
        </div>
      </div>

      <AgentAssignmentModal
        isOpen={assignModal.isOpen}
        onClose={closeAssignModal}
        onSubmit={handleAssignmentSubmit}
        agents={agents}
        currentAgentId={assignModal.order?.agent?.id}
        isLoading={isAssigning}
        orderNumber={assignModal.order?.orderNumber}
      />

      <BulkEditModal 
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedCount={selectedOrders.length}
        agents={agents}
        statuses={statuses}
        onUpdate={handleBulkUpdate}
        isLoading={isBulkUpdating}
      />
    </div>
  );
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <OrdersPageContent />
        </Suspense>
    )
}
