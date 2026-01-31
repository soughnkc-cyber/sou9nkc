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
import { getOrders, insertNewOrders, updateOrderRecallAt, updateOrderAgent, deleteOrders } from "@/lib/actions/orders";
import { getStatus, updateOrderStatus } from "@/lib/actions/status";
import { getMe, getAgents } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";


import { AgentAssignmentModal } from "@/components/forms/agent-assignment-modal";
import { AgentAssignmentData } from "@/components/forms/agent-assignment-form";
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
  const [agents, setAgents] = useState<{ id: string; name: string; iconColor?: string }[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [lastServerTime, setLastServerTime] = useState<string | null>(null);
  const user = session.data?.user;
  const isAdmin = user?.role === "ADMIN";

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
    } catch {
      toast.error("Erreur lors du changement de statut");
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
      toast.error("Erreur lors de la suppression des commandes");
    }
  };

  const handleRecallChange = async (orderId: string, value: string | null) => {
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

  // --------------------
  // useEffect
  // --------------------
  // Silent background refresh
  const refreshData = useCallback(async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setIsLoadingPage(true);
    try {
      const response = await getOrders(user);
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
    
    const interval = setInterval(() => {
        refreshData(true); // Silent background refresh
    }, 5000);

    return () => clearInterval(interval);
  }, [hasPermission, user, refreshData]);

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
        return dateFilteredOrders.filter(o => o.recallAt && isSameDay(new Date(o.recallAt), new Date()));
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
    const base = dateFilteredOrders;
    const total = base.length;
    const totalRevenue = base.reduce((sum, o) => sum + o.totalPrice, 0);
    const recallToday = base.filter(o => 
      o.recallAt && isSameDay(new Date(o.recallAt), new Date())
    ).length;
    
    // Taux de confirmation : STATUS_15 parmi toutes les commandes ayant un statut (dans la période)
    const ordersWithStatus = base.filter(o => o.status?.id || o.status?.name);
    const confirmedOrders = base.filter(o => {
      const status = o.status as any;
      if (!status) return false;
      
      const etatValue = status.etat?.toString() || "";
      const nameValue = status.name?.toString() || "";
      
      return (
        etatValue.toUpperCase() === 'STATUS_15' || 
        nameValue.toUpperCase().includes('STATUS_15')
      );
    });
    
    console.log("📊 [Stats Debug] Range:", dateRange);
    console.log("📊 [Stats Debug] Total in Period:", total);
    console.log("📊 [Stats Debug] With Status:", ordersWithStatus.length);
    console.log("📊 [Stats Debug] Confirmed:", confirmedOrders.length);
    if (confirmedOrders.length > 0) {
        console.log("📊 [Stats Debug] Example Confirmed Order:", confirmedOrders[0]);
    } else if (ordersWithStatus.length > 0) {
        console.log("📊 [Stats Debug] Example Non-Confirmed Order Status:", ordersWithStatus[0].status);
    }

    const treatmentRate = ordersWithStatus.length > 0 ? (confirmedOrders.length / ordersWithStatus.length) * 100 : 0;
    
    const ordersWithDuration = base.filter(o => o.processingTimeMin != null && o.processingTimeMin > 0);
    const avgDuration = ordersWithDuration.length > 0 
      ? ordersWithDuration.reduce((sum, o) => sum + (o.processingTimeMin || 0), 0) / ordersWithDuration.length 
      : 0;

    // Live New Arrivals should NOT be filtered by the calendar date range
    const allUnprocessed = orders.filter(o => !o.status);
    const newOrdersCount = allUnprocessed.filter(o => {
        if (!recallFilterEntryTime) return false;
        const oTime = new Date(o.createdAt).getTime();
        const eTime = recallFilterEntryTime.getTime();
        return oTime >= eTime;
    }).length;
    
    if (orders.length > 0) {
        console.log("🔔 [New Arrivals Debug] Last Order createdAt:", orders[0].createdAt);
        console.log("🔔 [New Arrivals Debug] Is Last Order New?", recallFilterEntryTime && new Date(orders[0].createdAt).getTime() >= recallFilterEntryTime.getTime());
    }

    return {
      total,
      totalRevenue,
      recallToday,
      treatmentRate,
      avgDuration,
      newOrdersCount
    };
  }, [dateFilteredOrders, recallFilterEntryTime]);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    active, 
    onClick, 
    color, 
    trend,
    trendUp 
  }: { 
    title: string; 
    value: number | string; 
    icon?: any; 
    active: boolean; 
    onClick?: () => void;
    color: string;
    trend?: string;
    trendUp?: boolean;
  }) => {
    const isClickable = !!onClick;

    return (
      <Card 
        onClick={isClickable ? onClick : undefined}
        className={cn(
          "relative p-2 sm:p-3 border border-gray-100 shadow-xs rounded-xl overflow-hidden bg-white flex flex-col justify-between h-full",
          isClickable ? "cursor-pointer transition-all duration-300 hover:shadow-md hover:border-blue-200 group" : "cursor-default",
          active ? "ring-2 ring-[#1F30AD] ring-offset-2" : ""
        )}
      >
      <div className="flex justify-between items-start mb-1 sm:mb-1">
        <div className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors", color)}>
          {Icon && <Icon className="h-4 w-4 sm:h-4 sm:w-4" />}
        </div>
        {trend && (
           <div className={cn(
             "px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold flex items-center gap-0.5",
             trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
           )}>
              {trendUp ? "↑" : "↓"} {trend}
           </div>
        )}
      </div>
      <div>
        <p className="text-[8px] sm:text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">{title}</p>
        <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-tight">{value}</h3>
      </div>
      {active && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1F30AD]" />
      )}
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
        handleRecallChange
    );
  }, [statuses, agents, productOptions, priceOptions, user?.role, (user as any)?.canEditOrders, handleStatusChange, handleAgentChange, handleRecallChange]);

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
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-end items-center md:items-center gap-4 sm:gap-6">
        {/* <div className="text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">Commandes</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Gérez vos flux de commandes synchronisées</p>
        </div> */}

        <div className="hidden sm:flex items-center justify-center w-full md:w-auto gap-2 sm:gap-3">
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
        </div>
      </div>

      {/* Stats Cards */}
      {/* Sticky Header Mobile - Persistent container for Recall Card and Filters */}
      <div className="sm:hidden sticky top-[64px] z-40 pb-2 bg-gray-50/95 backdrop-blur-sm -mx-4 px-4 pt-2 border-b border-gray-100/50 mb-2">
         <div className="grid grid-cols-2 gap-3">
            {/* Recall Card (Mobile Link) */}
             {(currentFilter === "torecall" || filterType === "torecall" || currentFilter === "new_arrivals") ? (
              <StatCard
                title="Nouveaux Arrivés"
                value={stats.newOrdersCount}
                icon={RefreshCw}
                active={currentFilter === "new_arrivals"}
                onClick={() => toggleFilter(currentFilter === "new_arrivals" ? "torecall" : "new_arrivals")}
                color="bg-purple-50"
                trend="Live"
                trendUp={true}
              />
            ) : (
              <StatCard
                title="À Rappeler"
                value={stats.recallToday}
                icon={PhoneIncoming}
                active={currentFilter === "torecall" || filterType === "torecall"}
                onClick={() => toggleFilter("torecall")}
                color="bg-blue-50"
                trend="3.2%"
                trendUp={false}
              />
            )}

            {/* Mobile Filters */}
            <div className="flex flex-col gap-2 p-2 justify-center items-center bg-white rounded-2xl border border-gray-100 shadow-xs h-full">
                <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-full" />
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-8 rounded-xl font-bold border-gray-200 hover:bg-blue-50 text-[#1F30AD] text-xs" 
                    onClick={() => refreshData()} 
                    disabled={isLoadingPage}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5 mr-2", isLoadingPage && "animate-spin")} />
                  Actualiser
                </Button>
            </div>
         </div>
      </div>

      {/* Stats Cards Desktop Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-3">
        

        {/* Recall Card (Desktop Only) */}
        <div className="hidden sm:block">
        {(currentFilter === "torecall" || filterType === "torecall" || currentFilter === "new_arrivals") ? (
          <StatCard
            title="Nouveaux Arrivés"
            value={stats.newOrdersCount}
            icon={RefreshCw}
            active={currentFilter === "new_arrivals"}
            onClick={() => toggleFilter(currentFilter === "new_arrivals" ? "torecall" : "new_arrivals")}
            color="bg-purple-50"
            trend="Live"
            trendUp={true}
          />
        ) : (
           <StatCard
            title="À Rappeler (Aujourd'hui)"
            value={stats.recallToday}
            icon={PhoneIncoming}
            active={currentFilter === "torecall" || filterType === "torecall"}
            onClick={() => toggleFilter("torecall")}
            color="bg-blue-50"
            trend="3.2%"
            trendUp={false}
          />
        )}
        </div>
        


        <StatCard
          title="Total Commandes"
          value={stats.total}
          icon={ShoppingCart}
          active={currentFilter === "all" && filterType === null}
          onClick={() => toggleFilter("all")}
          color="bg-blue-50"
          trend="12.5%"
          trendUp={true}
        />

        <StatCard
          title="Total Revenus"
          value={`${stats.totalRevenue.toLocaleString("fr-FR")} MRU`}
          icon={DollarSign}
          active={false}
          onClick={() => {}}
          color="bg-green-50"
          trend="8.1%"
          trendUp={true}
        />

        <StatCard
          title="Taux de Confirmation"
          value={`${(stats.treatmentRate || 0).toFixed(1)}%`}
          icon={Target}
          active={false}
          color="bg-blue-50"
          trend="5.4%"
          trendUp={true}
        />

        <StatCard
          title="Moy Temps Appel"
          value={`${Math.round(stats.avgDuration)} min`}
          icon={Clock}
          active={false}
          onClick={() => {}}
          color="bg-cyan-50"
          trend="2.1%"
          trendUp={false}
        />
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
            defaultPageSize={10}
            showSearch
            showPagination
            onSelectionChange={setSelectedOrders}
            getRowClassName={(row) => {
               const recallAt = row.recallAt ? new Date(row.recallAt) : null;
               if (recallAt && (isPast(recallAt) || isSameDay(recallAt, new Date()))) {
                 return "border border-red-500 shadow-sm shadow-red-100";
               }
               return "";
            }}
            mobileRowAction={(row) => {
               const recallAt = row.recallAt ? new Date(row.recallAt) : null;
               if (recallAt && (isPast(recallAt) || isSameDay(recallAt, new Date()))) {
                 return (
                   <div className="bg-red-600 rounded-full p-1.5 shadow-sm animate-pulse">
                     <Clock className="h-3.5 w-3.5 text-white" />
                   </div>
                 );
               }
               return null;
            }}
            extraSearchActions={
              <div className="flex items-center gap-2">
                {selectedOrders.length === 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-xl px-3 font-bold border-gray-200 hover:bg-blue-50 hover:text-[#1F30AD] transition-all text-xs" 
                    onClick={() => openAssignModal(selectedOrders[0])}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Modifier
                  </Button>
                )}
                {isAdmin && selectedOrders.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDeleteSelected} 
                    className="h-8 rounded-xl font-bold px-3 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Supprimer ({selectedOrders.length})
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
