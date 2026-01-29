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
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        value={order.status?.id}
        onValueChange={(value) => onChange(order.id, value)}
        disabled={readOnly}
      >
        <SelectTrigger className={cn("h-7 w-[130px] text-xs", readOnly && "opacity-50 cursor-not-allowed")}>
          <SelectValue placeholder="Sélectionner" />
        </SelectTrigger>

        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const AgentSelect = ({
    order,
    agents,
    onChange,
    readOnly,
  }: {
    order: Order;
    agents: { id: string; name: string }[];
    onChange: (orderId: string, agentId: string) => void;
    readOnly?: boolean;
  }) => {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Select
          value={order.agent?.id ?? "unassigned"}
          onValueChange={(value) => {
              if (value !== "unassigned") onChange(order.id, value)
          }}
          disabled={readOnly}
        >
          <SelectTrigger className={cn("h-7 min-w-[130px] text-xs border-dashed", 
              !order.agent && "text-muted-foreground",
              readOnly && "opacity-50 cursor-not-allowed")}>
            <div className="flex items-center gap-2">
              <UserIcon className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{order.agent?.name || "Non affecté"}</span>
            </div>
          </SelectTrigger>
    
          <SelectContent>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
  canEditOrders: boolean,
  statuses: { id: string; name: string }[],
  agents: { id: string; name: string }[],
  productOptions: string[],
  onStatusChange: (orderId: string, statusId: string | null) => void,
  onAssignAgent: (order: Order) => void,
  onRecallChange: (orderId: string, date: string | null) => void,
  onView?: (o: Order) => void,
  onEdit?: (o: Order) => void,
  onDelete?: (o: Order) => void
): ColumnDef<Order>[] => {
  const isAdminOrSupervisor = role === "ADMIN" || role === "SUPERVISOR";

  const actions = [];
  
  // Action assigner agent (Admin/Super)
  if (isAdminOrSupervisor) {
      actions.push({ 
          icon: UserIcon, 
          onClick: onAssignAgent, 
          className: "text-orange-600 hover:text-orange-800",
          label: "Assigner" 
      });
  }

  if (onView)
    actions.push({ icon: Eye, onClick: onView, className: "text-blue-600 hover:text-blue-800" });
  if (onEdit)
    actions.push({ icon: Edit, onClick: onEdit, className: "text-blue-600 hover:text-blue-800" });
  if (onDelete)
    actions.push({ icon: Trash2, onClick: onDelete, className: "text-red-600 hover:text-red-800" });


  return [
    
    createColumn<Order>({
      accessorKey: "orderNumber",
      header: "N°",
      sortable: true,
      cell: ({ row }) => <span className="font-mono text-xs">#{row.original.orderNumber}</span>,
    }),

    createColumn<Order>({
      accessorKey: "productNote",
      header: "Produit(s)",
      sortable: false,
      filterComponent: createFacetedFilter(
        "Produit",
        productOptions.map((p) => ({ label: p, value: p }))
      ),
      accessorFn: (row) => row.productNote, // For filtering
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.productNote ?? "-"}</span>,
    }),

    createColumn<Order>({
      accessorKey: "totalPrice",
      header: "Prix",
      sortable: true,
      cell: ({ row }) => <PriceBadge price={row.original.totalPrice} />,
    }),

    isAdminOrSupervisor
      ? createColumn<Order>({
          accessorKey: "agent",
          header: "Agent",
          sortable: true,
          accessorFn: (row) => row.agent?.name || "Non affecté", // For sorting/filtering text
          filterComponent: createFacetedFilter(
             "Agent",
             agents.map(a => ({ label: a.name, value: a.name }))
          ),
          cell: ({ row }) => (
             <div className="flex items-center gap-2">
                <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", 
                    row.original.agent ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400")}>
                  <UserIcon className="h-3 w-3" />
                </div>
                <span className={cn("text-xs font-medium", !row.original.agent && "text-gray-400 italic")}>
                  {row.original.agent?.name || "Non affecté"}
                </span>
              </div>
          ),
        })
      : createColumn<Order>({
          accessorKey: "customerName",
          header: "Client", // Show client instead of agent for agents themselves
          sortable: true,
          cell: ({ row }) => <span className="font-medium text-xs">{row.original.customerName}</span>,
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
      cell: ({ row }) => {
        return (
          <StatusSelect
            order={row.original}
            statuses={statuses}
            onChange={onStatusChange}
            readOnly={!canEditOrders}
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
      header: "Rappel",
      sortable: true,
      cell: ({ row }) => {
        return (
          <RecallCell
            order={row.original}
            onChange={onRecallChange}
            readOnly={!canEditOrders}
          />
        );
      },
    }),

    createColumn<Order>({
      accessorKey: "processingTimeMin",
      header: "Délai",
      sortable: true,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] whitespace-nowrap text-blue-600 bg-blue-50 border-blue-100">
          {formatDuration(row.original.processingTimeMin)}
        </Badge>
      ),
    }),


    ...(actions.length ? [createActionsColumn<Order>(actions)] : []),
  ];
  
};
