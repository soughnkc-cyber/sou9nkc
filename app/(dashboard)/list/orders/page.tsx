"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { isSameDay, differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";

import { DataTable } from "@/components/datatable";
import { getColumns, Order } from "./columns";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, PhoneIncoming, ShoppingCart, DollarSign, Target, Clock } from "lucide-react";
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
  const [statuses, setStatuses] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string; iconColor?: string }[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
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
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setIsLoadingPage(true);
    try {
      const data = await getOrders(user);
      setOrders(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setIsLoadingPage(false);
    }
  }, [user]);

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
      setStatuses(statusData);
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
          o.id === orderId ? { ...o, status: updated.status, recallAt: updated.recallAt } : o
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
      fetchOrders();
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
  useEffect(() => {
    if (hasPermission) {
      fetchOrders();
      fetchStatusesAndAgents();
    }
  }, [hasPermission, fetchOrders, fetchStatusesAndAgents]);


  // --------------------
  // Mémo
  // --------------------
  
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);

  // Apply filter based on URL query param OR local state OR Date range
  const filteredOrders = useMemo(() => {
    let result = orders;

    // 1. Date range filter
    if (dateRange?.from) {
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        result = result.filter(order => {
            const date = new Date(order.orderDate);
            return isWithinInterval(date, { start: from, end: to });
        });
    }

    // 2. Tab filter (URL or local)
    const activeFilter = currentFilter || filterType;
    if (!activeFilter || activeFilter === "all") return result;
    
    switch (activeFilter) {
      case "processed":
        return result.filter(order => order.status !== null && order.status !== undefined);
      case "toprocess":
        return result.filter(order => !order.status);
      case "torecall":
        return result.filter(o => o.recallAt && isSameDay(new Date(o.recallAt), new Date()));
      case "new_arrivals":
        return result.filter(o => 
          o.recallAt && isSameDay(new Date(o.recallAt), new Date()) &&
          differenceInHours(new Date(), new Date(o.orderDate)) <= 24
        );
      default:
        return result;
    }
  }, [orders, filterType, currentFilter, dateRange]);

  const stats = useMemo(() => {
    const total = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const recallToday = orders.filter(o => 
      o.recallAt && isSameDay(new Date(o.recallAt), new Date())
    ).length;
    
    const processedOrders = orders.filter(o => o.status).length;
    const treatmentRate = total > 0 ? (processedOrders / total) * 100 : 0;
    
    const ordersWithDuration = orders.filter(o => o.processingTimeMin != null && o.processingTimeMin > 0);
    const avgDuration = ordersWithDuration.length > 0 
      ? ordersWithDuration.reduce((sum, o) => sum + (o.processingTimeMin || 0), 0) / ordersWithDuration.length 
      : 0;

    const newOrdersCount = orders.filter(o => {
        const orderDate = new Date(o.orderDate);
        const isRecallToday = o.recallAt && isSameDay(new Date(o.recallAt), new Date());
        return isRecallToday && differenceInHours(new Date(), orderDate) <= 24;
    }).length;

    return {
      total,
      totalRevenue,
      recallToday,
      treatmentRate,
      avgDuration,
      newOrdersCount
    };
  }, [orders]);

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
    icon: any; 
    active: boolean; 
    onClick: () => void;
    color: string;
    trend?: string;
    trendUp?: boolean;
  }) => (
    <Card 
      onClick={onClick}
      className={cn(
        "relative p-4 sm:p-5 cursor-pointer transition-all duration-300 border border-gray-100 shadow-xs hover:shadow-md rounded-2xl overflow-hidden group bg-white flex flex-col justify-between",
        active ? "ring-2 ring-orange-500 ring-offset-2" : "hover:border-orange-200"
      )}
    >
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-orange-50 group-hover:bg-orange-100 transition-colors", color)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
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
        <h3 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">{value}</h3>
      </div>
      {active && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500" />
      )}
    </Card>
  );

  const productOptions = useMemo(() => {
     const notes = new Set(filteredOrders.map(o => o.productNote).filter(Boolean) as string[]);
     return Array.from(notes);
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
    // previous logic: const isManagement = user?.role === "ADMIN" || user?.role === "SUPERVISOR"; const canEdit = isManagement ? false : ...
    // Let's change it:
    const canEdit = !!(user as any)?.canEditOrders || user?.role === "ADMIN" || user?.role === "SUPERVISOR";
    
    return getColumns(
        user?.role, 
        canEdit, 
        statuses, 
        agents, 
        productOptions, 
        handleStatusChange, 
        handleAgentChange, 
        handleRecallChange
    );
  }, [statuses, agents, productOptions, user?.role, (user as any)?.canEditOrders, handleStatusChange, handleAgentChange, handleRecallChange]);

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
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-4 sm:gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">Commandes</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Gérez vos flux de commandes synchronisées</p>
        </div>

        <div className="flex items-center justify-center w-full md:w-auto gap-2 sm:gap-3">
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            <Button 
                variant="outline" 
                size="sm" 
                className="h-10 rounded-xl px-3 sm:px-4 font-bold border-gray-200 hover:bg-gray-50 shrink-0" 
                onClick={fetchOrders} 
                disabled={isLoadingPage}
            >
              <RefreshCw className={cn("h-4 w-4 sm:mr-2", isLoadingPage && "animate-spin")} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
        

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
            color="bg-orange-50"
            trend="3.2%"
            trendUp={false}
          />
        )}

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
          title="Taux de Traitement"
          value={`${stats.treatmentRate.toFixed(1)}%`}
          icon={Target}
          active={currentFilter === "processed" || filterType === "processed"}
          onClick={() => toggleFilter("processed")}
          color="bg-orange-50"
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
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight pl-1">Liste des commandes</h2>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">{stats.total} total</span>
            </div>
        </div>
        
        <div className="bg-white rounded-3xl p-2 border border-gray-100 shadow-sm">
          <DataTable<Order, unknown>
            columns={columns}
            data={filteredOrders}
            searchPlaceholder="Rechercher une commande..."
            pageSizeOptions={[5, 10, 20]}
            defaultPageSize={10}
            showSearch
            showPagination
            onSelectionChange={setSelectedOrders}
            extraSearchActions={
              isAdmin && selectedOrders.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="h-8 rounded-xl font-bold px-4">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer ({selectedOrders.length})
                </Button>
              )
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

