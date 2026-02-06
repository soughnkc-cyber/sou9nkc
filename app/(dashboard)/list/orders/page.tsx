"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { isSameDay, differenceInHours, isPast } from "date-fns";
import { cn } from "@/lib/utils";

import { DataTable } from "@/components/datatable";
import { getColumns, Order } from "./columns";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, PhoneIncoming, ShoppingCart, DollarSign, Target, Clock, Edit } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/* Actions */
import { getOrders, insertNewOrders, updateOrderRecallAt, updateOrderAgent, deleteOrders, updateOrdersAgent, updateOrdersStatus, bulkUpdateOrders } from "@/lib/actions/orders";
import { getStatus, updateOrderStatus } from "@/lib/actions/status";
import { getMe, getAgents } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";


import { AgentAssignmentModal } from "@/components/forms/agent-assignment-modal";
import { AgentAssignmentData } from "@/components/forms/agent-assignment-form";
import { BulkEditModal } from "@/components/forms/bulk-edit-modal"; // Import BulkEditModal
import { DatePickerWithRange } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";

function OrdersPageContent() {
  const session = useSession();

  // --------------------
  // Hooks
  // --------------------
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string; color?: string; isActive?: boolean; etat: string }[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string; isActive: boolean; iconColor?: string }[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [tableFilteredOrders, setTableFilteredOrders] = useState<Order[]>([]);
  const [lastServerTime, setLastServerTime] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false); // New state to pause refresh
  const user = session.data?.user;
  const isAdmin = user?.role === "ADMIN";
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, { statusId?: string | null, recallAt?: string | null }>>({});

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
  const filterType = searchParams.get("filter"); // "processed", "toprocess", or "torecall"

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

  // --------------------
  // Actions
  // --------------------

  // const insertOrders = useCallback(async () => {
  //   try {
  //     const res = await fetch("/api/orders");
  //     const json = await res.json();
  //     if (!res.ok) throw new Error(json.message);
  //
  //     // Insère dans la DB avec attribution round-robin
  //     await insertNewOrders(json.orders);
  //     toast.success("Commandes synchronisées avec succès");
  //     fetchOrders();
  //   } catch (error) {
  //     console.error(error);
  //     toast.error("Erreur lors de l'insertion des commandes");
  //   }
  // }, [fetchOrders]);

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
      toast.error("Erreur lors du chargement des données auxiliaires");
    }
  }, []);

  const handleStatusChange = async (orderId: string, statusId: string | null) => {
    if (isMobile) {
      setPendingUpdates(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], statusId }
      }));
      toast.info("Changement prêt (cliquez sur OK pour valider)", { duration: 2000 });
      return;
    }

    try {
      const updated = await updateOrderStatus(orderId, statusId);
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId ? { 
            ...o, 
            status: updated.status, 
            recallAt: updated.recallAt,
            recallAttempts: updated.recallAttempts 
          } : o
        )
      );
      toast.success("Statut mis à jour");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du changement de statut");
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
      toast.success("Agent réassigné");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la réassignation");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedOrders.length === 0) return;
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedOrders.length} commandes ?`)) return;

    try {
      await deleteOrders(selectedOrders.map(o => o.id));
      toast.success(`${selectedOrders.length} commandes supprimées`);
      setSelectedOrders([]);
      refreshData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleRecallChange = async (orderId: string, value: string | null) => {
    if (isMobile) {
      setPendingUpdates(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], recallAt: value }
      }));
      toast.info("Rappel prêt (cliquez sur OK pour valider)", { duration: 2000 });
      return;
    }

    try {
      const date = value ? new Date(value) : null;
      const updated = await updateOrderRecallAt(orderId, date);
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, recallAt: updated.recallAt } : o))
      );
      toast.success("Date de rappel mise à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour du rappel");
    }
  };

  const handleSaveMobileUpdates = async (orderId: string) => {
    const pending = pendingUpdates[orderId];
    if (!pending) return;

    try {
      setIsLoadingPage(true);
      const res = await bulkUpdateOrders([orderId], {
        statusId: pending.statusId,
        recallAt: pending.recallAt ? new Date(pending.recallAt) : (pending.recallAt === null ? null : undefined)
      });

      if (res.success) {
        toast.success("Commande mise à jour");
        setPendingUpdates(prev => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        refreshData(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation");
    } finally {
      setIsLoadingPage(false);
    }
  };

  // --------------------
  // useEffect
  // --------------------
  // Silent background refresh
  const refreshData = useCallback(async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setIsLoadingPage(true);
    try {
      const response = await getOrders();
      setOrders(response.orders);
      setLastServerTime(response.serverTime);
    } catch (error) {
      console.error(error);
      if (!isSilent) toast.error("Erreur lors de la mise à jour");
    } finally {
      if (!isSilent) setIsLoadingPage(false);
    }
  }, [user]);

  // Handle Initial Fetch
  useEffect(() => {
    if (hasPermission) {
      refreshData(); // First load is visible
      fetchStatusesAndAgents();
    }
  }, [hasPermission, refreshData, fetchStatusesAndAgents]);

  // 🔄 Auto-Refresh Polling (Every 15 seconds)
  useEffect(() => {
    if (!hasPermission || !user) return;
    
    // Skip if paused (editing)
    if (isPaused) { 
        console.log("⏸️ [Refresh] Paused due to user interaction");
        return; 
    }
    
    const interval = setInterval(() => {
        refreshData(true); // Silent background refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [hasPermission, user, refreshData, isPaused]);

  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [recallFilterEntryTime, setRecallFilterEntryTime] = useState<Date | null>(null);

  // Track entry time into "torecall" filter for the "New Arrivals" alert
  useEffect(() => {
    const activeFilter = currentFilter || filterType;
    if (activeFilter === "torecall") {
        if (!recallFilterEntryTime && lastServerTime) {
            const entryTime = new Date(lastServerTime);
            console.log("🔔 [Lifecycle] Setting entry time to:", entryTime.toISOString());
            setRecallFilterEntryTime(entryTime);
        }
    } else if (activeFilter !== "new_arrivals") {
        if (recallFilterEntryTime) console.log("🔔 [Lifecycle] Resetting entry time (leaving filter)");
        setRecallFilterEntryTime(null);
    }
  }, [currentFilter, filterType, recallFilterEntryTime, lastServerTime]);

  // 1. Base filtered by Date (for Stats and for category filtering)
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

  // 2. Further filtered by category (for the Table)
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
  }, [dateFilteredOrders, filterType, currentFilter, recallFilterEntryTime]);

  const stats = useMemo(() => {
    // We use the data currently filtered in the table (by search, columns, etc)
    // if there are no table filters, tableFilteredOrders might be empty or full.
    // However, the DataTable component sets tableFilteredOrders which already 
    // accounts for search and column filters.
    // Our 'filteredOrders' (from currentFilter/filterType) is what's passed TO the table.
    
    // The user wants stats to apply to ALL cards based on filters.
    // We should use tableFilteredOrders because it represents the final visible set.
    const base = tableFilteredOrders;
    
    // Helper function to calculate stats for a given set of orders
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

      // New: Period-aware recall and arrivals calculation within the filtered set
      const recallDue = orderSet.filter(o => 
        o.recallAt && new Date(o.recallAt) <= new Date()
      ).length;

      const newOrdersCount = orderSet.filter(o => {
          if (!recallFilterEntryTime || o.status) return false;
          const oTime = new Date(o.createdAt).getTime();
          const eTime = recallFilterEntryTime.getTime();
          return oTime >= eTime;
      }).length;

      return { total, totalRevenue, treatmentRate, avgDuration, recallDue, newOrdersCount };
    };

    // Calculate current period stats from filtered data
    const currentStats = calculateStats(base);
    
    // Calculate previous period stats for trend comparison
    // This part remains based on the dateRange relative to the FULL orders list 
    // to give a meaningful comparison of "this period vs last period"
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
      recallToday: currentStats.recallDue,
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
  }, [tableFilteredOrders, recallFilterEntryTime, orders, dateRange]);

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

  // --------------------
  // Modal d'assignation
  // --------------------
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean; order: Order | null }>({
    isOpen: false,
    order: null,
  });
  const [isAssigning, setIsAssigning] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false); // State for bulk edit
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false); // State for modal visibility

  const openAssignModal = (order: Order) => {
    setAssignModal({ isOpen: true, order });
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
        toast.success(`${res.count} commandes mises à jour avec succès`);
        setSelectedOrders([]);
        // Simple refresh approach
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const columns = useMemo(() => {
    // BUG FIX: The user wants ADMIN and SUPERVISOR to be able to edit too
    const canEdit = !!(user as any)?.canEditOrders || user?.role === "ADMIN" || user?.role === "SUPERVISOR";
    
    return getColumns(
        user?.role, 
        canEdit, 
        statuses, 
        agents, 
        productOptions,
        priceOptions, // Add price options
        handleStatusChange, 
        handleAgentChange, 
        handleRecallChange,
        undefined, // onView
        undefined, // onEdit
        undefined, // onDelete
        () => setIsPaused(true), // onInteractionStart
        () => setIsPaused(false), // onInteractionEnd
        pendingUpdates
    );
  }, [statuses, agents, productOptions, priceOptions, user?.role, (user as any)?.canEditOrders, handleStatusChange, handleAgentChange, handleRecallChange, pendingUpdates]);

  const toggleFilter = (filter: string) => {
    setCurrentFilter(prev => prev === filter ? null : filter);
  };


  // --------------------
  // Rendu
  // --------------------
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-end items-center md:items-center gap-4 sm:gap-6">
        {/* <div className="text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">Commandes</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Gérez vos flux de commandes synchronisées</p>
        </div> */}

        {/* <div className="hidden sm:flex items-center justify-center w-full md:w-auto gap-2 sm:gap-3">
           
            <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-[260px]" />
            {/* <Button 
                variant="outline" 
                size="sm" 
                className="h-10 rounded-xl px-3 sm:px-4 font-bold border-gray-200 hover:bg-blue-50 hover:text-[#1F30AD] hover:border-blue-200 shrink-0" 
                onClick={() => refreshData()} 
                disabled={isLoadingPage}
            >
              <RefreshCw className={cn("h-4 w-4 sm:mr-2", isLoadingPage && "animate-spin")} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button> */}
        {/* </div> */} 
      </div>

      {/* Stats Cards */}
      {/* Stats Cards Section */}
      <div className="flex flex-col gap-2 sm:gap-4 -mt-2 sm:mt-0">
        
        {/* Row 1: Recall / New Arrivals (Full Width) */}
        <div className="w-full">
            {(currentFilter === "torecall" || filterType === "torecall" || currentFilter === "new_arrivals") ? (
              <StatCard
                title="Nouveaux Arrivés"
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
                title="À RAPPELER"
                value={stats.recallToday}
                icon={PhoneIncoming}
                active={currentFilter === "torecall" || filterType === "torecall"}
                onClick={() => toggleFilter("torecall")}
                color="bg-red-500/10 text-red-600"
                bgColor="#ffe3e3"
              />
            )}
        </div>

        {/* Row 2: Grid 2x2 (Mobile) / 4 cols (Desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <StatCard
              title="TOTAL COMMANDES"
              value={stats.total}
              icon={ShoppingCart}
              active={currentFilter === "all" && filterType === null}
              onClick={() => toggleFilter("all")}
              color="bg-blue-500/10 text-blue-600"
              bgColor="#e3f0ff"
              trend={stats.totalTrend}
              trendUp={stats.totalTrendUp}
            />

            <StatCard
              title="TOTAL REVENUS"
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
              title="TAUX DE CONFIRMATION"
              value={`${(stats.treatmentRate || 0).toFixed(1)}%`}
              icon={Target}
              active={false}
              color="bg-yellow-500/10 text-yellow-600"
              bgColor="#fffbe3"
              trend={stats.treatmentRateTrend}
              trendUp={stats.treatmentRateTrendUp}
            />

            <StatCard
              title="MOY TEMPS APPEL"
              value={`${Math.round(stats.avgDuration)} min`}
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

      {/* Table Section */}
      <div className="space-y-4">
        {/* <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight pl-1">Liste des commandes</h2>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">{stats.total} total</span>
            </div>
        </div> */}
        
        <div className="bg-white rounded-3xl p-2 border border-gray-100 shadow-sm">
          <DataTable<Order, unknown>
            columns={columns}
            data={filteredOrders}
            searchPlaceholder="Rechercher une commande..."
            pageSizeOptions={[10, 20, 50]}
            defaultPageSize={50}
            showSearch
            showPagination
            rightHeaderActions={
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
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
               return (
                  <Button
                    size="sm"
                    className={cn(
                      "h-8 px-4 font-bold rounded-lg shadow-sm transition-all",
                      pending 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (pending) handleSaveMobileUpdates(row.id);
                    }}
                    disabled={!pending || isLoadingPage}
                  >
                    OK
                  </Button>
               );
            }}
            extraSearchActions={
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedOrders.length > 0 && (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setIsBulkModalOpen(true)}
                     className="h-8 rounded-lg px-2 font-bold border-gray-200 hover:bg-blue-50 hover:text-[#1F30AD] transition-all flex items-center justify-center gap-2 shadow-sm"
                     title="Modifier la sélection"
                   >
                     <Edit className="h-4 w-4" />
                     <span className="hidden sm:inline">Modifier ({selectedOrders.length})</span>
                     <span className="sm:hidden">({selectedOrders.length})</span>
                   </Button>
                )}
                {isAdmin && selectedOrders.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDeleteSelected} 
                    className="h-8 min-w-[32px] rounded-lg font-bold px-1.5 flex items-center justify-center gap-1.5 shadow-sm shadow-red-100"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="text-[10px] bg-white/20 px-1 rounded-md">{selectedOrders.length}</span>
                  </Button>
                )}
              </div>
            }
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

export default function OrdersPage() {
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}
