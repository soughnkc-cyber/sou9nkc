"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { toast } from "sonner";

import { DataTable } from "@/components/datatable";
import { getColumns, Order } from "./columns";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/* Actions */
import { getOrders, insertNewOrders, updateOrderRecallAt, updateOrderAgent } from "@/lib/actions/orders";
import { getStatus, updateOrderStatus } from "@/lib/actions/status";
import { getMe, getAgents } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";


import { AgentAssignmentModal } from "@/components/forms/agent-assignment-modal";
import { AgentAssignmentData } from "@/components/forms/agent-assignment-form";

export default function OrdersPage() {
  const session = useSession();

  // --------------------
  // Hooks
  // --------------------
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);


  // --------------------
  // Redirection si non connecté
  // --------------------
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


  const user = session.data?.user;

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
  const stats = useMemo(
    () => ({
      total: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
    }),
    [orders]
  );
  
  const productOptions = useMemo(() => {
     // Extract unique product notes (or split them if comma separated?)
     // The user asked for "Products" filter. `productNote` often contains "Produit A, Produit B".
     // Simple approach: just unique values of the full string for now, or split.
     // Let's split by comma to give more granular filters if meaningful.
     // But `productNote` is just a string in `Order` type on client (based on `columns.tsx`).
     // Let's keep it simple: Unique full strings first.
     const notes = new Set(orders.map(o => o.productNote).filter(Boolean) as string[]);
     return Array.from(notes);
  }, [orders]);

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
    // Rule: ADMIN and SUPERVISOR are ALWAYS read-only for orders
    const isManagement = user?.role === "ADMIN" || user?.role === "SUPERVISOR";
    const canEdit = isManagement ? false : !!(user as any)?.canEditOrders;
    
    return getColumns(
        user?.role, 
        canEdit, 
        statuses, 
        agents, 
        productOptions, 
        handleStatusChange, 
        openAssignModal, // Fix: Pass the function that opens the modal
        handleRecallChange
    );
  }, [statuses, agents, productOptions, user?.role, (user as any)?.canEditOrders, handleStatusChange, /* openAssignModal is stable or declared outside? No, let's include it in deps if needed */ handleRecallChange]);




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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Commandes</h1>
          <p className="text-gray-500 mt-1">Liste des commandes récupérées depuis Shopify</p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={isLoadingPage}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPage ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      </div>

      {/* Stats */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Card className="p-3">
            <CardContent className="p-0 flex justify-between">
              <span>Total commandes</span>
              <span className="font-bold">{stats.total}</span>
            </CardContent>
          </Card>

          <Card className="p-3">
            <CardContent className="p-0 flex justify-between">
              <span>Chiffre d’affaires</span>
              <span className="font-bold text-green-600">
                {stats.totalRevenue.toLocaleString("fr-FR")} MRU
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des commandes</CardTitle>
          <CardDescription>{stats.total} commandes synchronisées</CardDescription>
        </CardHeader>

        <CardContent>
          <DataTable<Order, unknown>
            columns={columns}
            data={orders}
            searchPlaceholder="Rechercher une commande..."
            pageSizeOptions={[5, 10, 20]}
            defaultPageSize={10}
            showSearch
            showPagination
          />
        </CardContent>
      </Card>


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
