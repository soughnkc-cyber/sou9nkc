"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
import { toast } from "sonner";

/* Action Orders */
import { getOrders, updateOrderRecallAt } from "@/lib/actions/orders";
import { getStatus } from "@/lib/actions/status";
import { updateOrderStatus } from "@/lib/actions/status";



/* Stats */
const getOrderStats = (orders: Order[]) => ({
  total: orders.length,
  totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
});

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);

  const insertOrders = useCallback(async () => {
    try {
      const data = await fetch("/api/orders");
      const json = await data.json();

      if(!data.ok){
        throw new Error(json.message);
      }

      console.log(json.length);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des commandes");
    }
  }, []);
  /* Fetch */
  const fetchStatuses = useCallback(async () => {
    try {
      const data = await getStatus();
      setStatuses(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des statuts");
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setIsLoadingPage(true);
    try {
      const data = await getOrders();
      setOrders(data);

      console.log("data: ",data);
      console.log("orders: ",orders);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setIsLoadingPage(false);
    }
  }, []);

  const handleStatusChange = async (
  orderId: string,
  statusId: string | null
) => {
  try {
    const updated = await updateOrderStatus(orderId, statusId);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: updated.status, recallAt: updated.recallAt }
          : o
      )
    );

    toast.success("Statut mis à jour");
  } catch {
    toast.error("Erreur lors du changement de statut");
  }
};

const handleRecallChange = async (
  orderId: string,
  value: string | null
) => {
  const date = value ? new Date(value) : null;

  const updated = await updateOrderRecallAt(orderId, date);

  setOrders((prev) =>
    prev.map((o) =>
      o.id === orderId
        ? { ...o, recallAt: updated.recallAt }
        : o
    )
  );

  toast.success("Date de rappel mise à jour");
};
  

  useEffect(() => {
    fetchOrders();
    insertOrders();
    fetchStatuses();
  }, [fetchOrders, insertOrders, fetchStatuses]);

  /* Memo */
  const stats = useMemo(() => getOrderStats(orders), [orders]);
 const columns = useMemo(
  () => getColumns(statuses, handleStatusChange, handleRecallChange),
  [statuses]
);


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Commandes</h1>
          <p className="text-gray-500 mt-1">
            Liste des commandes récupérées depuis Shopify
          </p>
        </div>
        

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={isLoadingPage}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoadingPage ? "animate-spin" : ""}`}
          />
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
          <CardDescription>
            {stats.total} commandes synchronisées
          </CardDescription>
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
    </div>
  );
}
