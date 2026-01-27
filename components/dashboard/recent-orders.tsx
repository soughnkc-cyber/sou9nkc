"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ShoppingBagIcon } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: number;
  customerName: string | null;
  totalPrice: number;
  createdAt: Date;
  status: { name: string } | null;
  agent?: { name: string | null } | null;
}

interface RecentOrdersProps {
  orders: Order[];
  showAgent?: boolean;
}

export function RecentOrders({ orders, showAgent = false }: RecentOrdersProps) {
  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold flex items-center">
          <ShoppingBagIcon className="mr-2 h-5 w-5 text-blue-600" />
          Commandes Récentes
        </CardTitle>
        <Link 
          href="/list/orders" 
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Voir tout
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground italic text-sm">
              Aucune commande récente.
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                    #{order.orderNumber}
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate max-w-[150px]">
                      {order.customerName || "Client inconnu"}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {format(new Date(order.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-black text-blue-900">
                    {order.totalPrice.toLocaleString("fr-FR", { style: "currency", currency: "MRU" })}
                  </span>
                  <div className="flex gap-1 items-center">
                    {showAgent && order.agent?.name && (
                      <span className="text-[10px] text-gray-400 font-medium">
                        {order.agent.name} •
                      </span>
                    )}
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 uppercase font-bold bg-blue-50 text-blue-700 border-blue-200">
                      {order.status?.name || "Sans statut"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
