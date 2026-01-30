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

export function RecentOrders({ orders = [], showAgent = false }: RecentOrdersProps) {
  const safeFormatDate = (dateInput: any) => {
    try {
      if (!dateInput) return "Date inconnue";
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return "Date invalide";
      return format(date, "dd MMM yyyy HH:mm", { locale: fr });
    } catch (e) {
      return "Format erreur";
    }
  };

  return (
    <Card className="col-span-full lg:col-span-4 border-slate-100 shadow-xs rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 border-b border-gray-100">
        <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
          <ShoppingBagIcon className="mr-2 h-4 w-4 text-orange-600" />
          Commandes Récentes
        </CardTitle>
        <Link 
          href="/list/orders" 
          className="text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 transition-colors"
        >
          Voir tout
        </Link>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {!orders || orders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground italic text-sm">
              Aucune commande récente.
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-white hover:bg-orange-50/30 hover:border-orange-100 transition-all duration-300 group shadow-xs"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 font-black text-[10px] shadow-xs group-hover:scale-110 transition-transform">
                    #{order.orderNumber}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-orange-900 transition-colors truncate max-w-[150px]">
                      {order.customerName || "Client inconnu"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {safeFormatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                    {order.totalPrice.toLocaleString("fr-FR", { style: "currency", currency: "MRU" })}
                  </span>
                  <div className="flex gap-2 items-center">
                    {showAgent && order.agent?.name && (
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {order.agent.name} •
                      </span>
                    )}
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase font-black bg-orange-50 text-orange-700 border-orange-100 shadow-xs">
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
