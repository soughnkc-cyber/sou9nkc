"use client";

import { ColumnDef } from "@tanstack/react-table";
import { createColumn, createActionsColumn, createFacetedFilter } from "@/components/columns";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
  processingTimeMin?: number | null;
  agent?: {
    id: string;
    name: string | null;
    phone: string;
  } | null;
}

const StatusSelect = ({
  order,
  statuses,
  onChange,
  readOnly,
}: {
  order: Order;
  statuses: { id: string; name: string }[];
  onChange: (orderId: string, statusId: string | null) => void;
  readOnly?: boolean;
}) => {
  return (
    <Select
      value={order.status?.id ?? "none"}
      onValueChange={(value) =>
        onChange(order.id, value === "none" ? null : value)
      }
      disabled={readOnly}
    >
      <SelectTrigger className={cn("h-4 w-[120px]", readOnly && "opacity-50 cursor-not-allowed")}>
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

const formatDuration = (minutes?: number | null) => {
  if (minutes == null) return "-";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ""}`;
};

const PriceBadge = ({ price }: { price: number }) => (
  <Badge variant="secondary" className="bg-green-100 text-green-800">
    {price.toLocaleString("fr-FR", { style: "currency", currency: "MRU" })}
  </Badge>
);

/* -------- Columns -------- */
export const getColumns = (
  role: string | undefined,
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
      accessorKey: "processingTimeMin",
      header: "Délai",
      sortable: true,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold text-blue-600 bg-blue-50 border-blue-100">
          {formatDuration(row.original.processingTimeMin)}
        </Badge>
      ),
    }),

    ...(role === "ADMIN" || role === "SUPERVISOR"
      ? [
          createColumn<Order>({
            accessorKey: "agent",
            header: "Agent Affecté",
            sortable: true,
            accessorFn: (row) => row.agent?.name,
            cell: ({ row }) => (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <UserIcon className="h-3 w-3" />
                </div>
                <span className="text-xs font-semibold text-gray-700">
                  {row.original.agent?.name || "Non affecté"}
                </span>
              </div>
            ),
          }),
        ]
      : []),

    createColumn<Order>({
      accessorKey: "status",
      header: "Statut",
      sortable: true,
      filterComponent: createFacetedFilter(
        "Statut",
        statuses.map((s) => ({ label: s.name, value: s.name }))
      ),
      accessorFn: (row) => row.status?.name,
      cell: ({ row }) => {
        const isAdminOrSupervisor = role === "ADMIN" || role === "SUPERVISOR";
        return (
          <StatusSelect
            order={row.original}
            statuses={statuses}
            onChange={onStatusChange}
            readOnly={isAdminOrSupervisor}
          />
        );
      },
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
      cell: ({ row }) => {
        const isAdminOrSupervisor = role === "ADMIN" || role === "SUPERVISOR";
        return (
          <RecallCell
            order={row.original}
            onChange={onRecallChange}
            readOnly={isAdminOrSupervisor}
          />
        );
      },
    }),

    ...(actions.length ? [createActionsColumn<Order>(actions)] : []),
  ];
  
};
