"use client";

import { ColumnDef } from "@tanstack/react-table";
import { createColumn, createActionsColumn, createFacetedFilter } from "@/components/columns";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecallCell } from "@/components/recallAt";

export interface Order {
  id: string;
  customerName: string | null;
  customerPhone: string | null;
  orderNumber: number;
  productNote: string | null;
  orderDate: string;
  totalPrice: number;
  recallAt: string | null;

  status?: {
  id: string;
  name: string;
  recallAfterH?: number | null;
} | null;

}

const StatusSelect = ({
  order,
  statuses,
  onChange,
}: {
  order: Order;
  statuses: { id: string; name: string }[];
  onChange: (orderId: string, statusId: string | null) => void;
}) => {
  return (
    <Select
      value={order.status?.id ?? "none"}
      onValueChange={(value) =>
        onChange(order.id, value === "none" ? null : value)
      }
    >
      <SelectTrigger className="h-4 w-[120px]">
        <SelectValue placeholder="Sans statut" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="none">Sans statut</SelectItem>

        {statuses.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const formatDateTime = (date?: string | null) => {
  if (!date) return "-";
  const d = new Date(date);
  return (
    d.toLocaleDateString("fr-FR") +
    " " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
};

const PriceBadge = ({ price }: { price: number }) => (
  <Badge variant="secondary" className="bg-green-100 text-green-800">
    {price.toLocaleString("fr-FR", { style: "currency", currency: "MRU" })}
  </Badge>
);

/* -------- Columns -------- */
export const getColumns = (
  statuses: { id: string; name: string }[],
  onStatusChange: (orderId: string, statusId: string | null) => void,
  onRecallChange: (orderId: string, date: string | null) => void,
  onView?: (o: Order) => void,
  onEdit?: (o: Order) => void,
  onDelete?: (o: Order) => void
): ColumnDef<Order>[] => {
  const actions = [];
  if (onView)
    actions.push({ icon: Eye, onClick: onView, className: "text-blue-600 hover:text-blue-800" });
  if (onEdit)
    actions.push({ icon: Edit, onClick: onEdit, className: "text-blue-600 hover:text-blue-800" });
  if (onDelete)
    actions.push({ icon: Trash2, onClick: onDelete, className: "text-red-600 hover:text-red-800" });

  return [
    
    createColumn<Order>({
      accessorKey: "orderNumber",
      header: "Numéro de commande",
      sortable: true,
      cell: ({ row }) => `#${row.original.orderNumber}`,
    }),

    createColumn<Order>({
      accessorKey: "productNote",
      header: "Produit(s)",
      sortable: false,
      cell: ({ row }) => row.original.productNote ?? "-",
    }),

    createColumn<Order>({
      accessorKey: "totalPrice",
      header: "Prix total",
      sortable: true,
      cell: ({ row }) => <PriceBadge price={row.original.totalPrice} />,
    }),

    createColumn<Order>({
      accessorKey: "customerName",
      header: "Nom du client",
      sortable: true,
      cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span>,
    }),

    createColumn<Order>({
      accessorKey: "status",
      header: "Statut",
      sortable: true,
      filterComponent: createFacetedFilter(
        "Statut",
        statuses.map((s) => ({ label: s.name, value: s.name }))
      ),
      accessorFn: (row) => row.status?.name,
      cell: ({ row }) => (
        <StatusSelect
          order={row.original}
          statuses={statuses}
          onChange={onStatusChange}
        />
      ),
    }),

    createColumn<Order>({
      accessorKey: "customerPhone",
      header: "Téléphone",
      sortable: true,
      cell: ({ row }) => row.original.customerPhone ?? "-",
    }),
    
    createColumn<Order>({
      accessorKey: "orderDate",
      header: "Date de commande",
      sortable: true,
      cell: ({ row }) => formatDateTime(row.original.orderDate),
    }),
    createColumn<Order>({
      accessorKey: "recallAt",
      header: "Date de rappel",
      cell: ({ row }) => (
        <RecallCell
          order={row.original}
          onChange={onRecallChange}
        />
      ),
    }),

    ...(actions.length ? [createActionsColumn<Order>(actions)] : []),
  ];
  
};
