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
    color?: string;
    recallAfterH?: number | null;
  } | null;
  processingTimeMin?: number | null;
  agent?: {
    id: string;
    name: string | null;
    phone: string;
    iconColor?: string;
  } | null;
}

const StatusSelect = ({
  order,
  statuses,
  onChange,
  readOnly,
}: {
  order: Order;
  statuses: { id: string; name: string; color?: string }[];
  onChange: (orderId: string, statusId: string | null) => void;
  readOnly?: boolean;
}) => {
  const selectedStatus = statuses.find(s => s.id === order.status?.id);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        value={order.status?.id}
        onValueChange={(value) => onChange(order.id, value)}
        disabled={readOnly}
      >
        <SelectTrigger className={cn("h-7 w-[140px] text-xs", readOnly && "opacity-50 cursor-not-allowed")}>
          <div className="flex items-center gap-2 truncate">
             {order.status?.id && selectedStatus?.color && (
                <div 
                   className="w-2 h-2 rounded-full shrink-0" 
                   style={{ backgroundColor: selectedStatus.color }}
                />
             )}
             <SelectValue placeholder="Sélectionner" />
          </div>
        </SelectTrigger>

        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.id} value={s.id}>
               <span>{s.name}</span>
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
    agents: { id: string; name: string; iconColor?: string }[];
    onChange: (orderId: string, agentId: string) => void;
    readOnly?: boolean;
  }) => {
    const selectedAgent = agents.find(a => a.id === order.agent?.id);

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Select
          value={order.agent?.id ?? "unassigned"}
          onValueChange={(value) => {
              onChange(order.id, value)
          }}
          disabled={readOnly}
        >
          <SelectTrigger className={cn("h-7 w-[150px] text-xs", readOnly && "opacity-50 cursor-not-allowed")}>
             <div className="flex items-center gap-2 truncate">
                {order.agent?.id && selectedAgent?.iconColor && (
                   <div 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: selectedAgent.iconColor }}
                   />
                )}
                <SelectValue placeholder="Agent" />
             </div>
          </SelectTrigger>
    
          <SelectContent>
            <SelectItem value="unassigned" className="text-gray-400 italic">
               Non affecté
            </SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <div className="flex items-center gap-2">
                   <span>{a.name}</span>
                </div>
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
import { differenceInDays, isSameDay, isPast, parseISO } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

export const getColumns = (
  role: string | undefined,
  canEditOrders: boolean,
  statuses: { id: string; name: string; color?: string }[],
  agents: { id: string; name: string; iconColor?: string }[],
  productOptions: string[],
  onStatusChange: (orderId: string, statusId: string | null) => void,
  onAgentChange: (orderId: string, agentId: string) => void,
  onRecallChange: (orderId: string, date: string | null) => void,
  onView?: (o: Order) => void,
  onEdit?: (o: Order) => void,
  onDelete?: (o: Order) => void
): ColumnDef<Order>[] => {
  const isAdminOrSupervisor = role === "ADMIN" || role === "SUPERVISOR";
  const isAdmin = role === "ADMIN";

  const actions = [];
  
  if (onView)
    actions.push({ icon: Eye, onClick: onView, className: "text-blue-600 hover:text-blue-800" });
  if (onEdit)
    actions.push({ icon: Edit, onClick: onEdit, className: "text-blue-600 hover:text-blue-800" });
  if (onDelete && isAdmin)
    actions.push({ icon: Trash2, onClick: onDelete, className: "text-red-600 hover:text-red-800" });


  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Sélectionner tout"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Sélectionner la ligne"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    
    createColumn<Order>({
      accessorKey: "orderNumber",
      header: "N°",
      isPrimary: true,
      sortable: false,
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
      accessorKey: "orderDate",
      header: "Date Commande",
      sortable: false,
      cell: ({ row }) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(row.original.orderDate)}</span>,
    }),

    createColumn<Order>({
      accessorKey: "totalPrice",
      header: "Prix",
      isPrimary: true,
      sortable: false,
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
             <AgentSelect 
                order={row.original} 
                agents={agents} 
                onChange={onAgentChange} 
                readOnly={!isAdminOrSupervisor} 
             />
          ),
        })
      : createColumn<Order>({
          accessorKey: "customerName",
          header: "Client", // Show client instead of agent for agents themselves
          sortable: false,
          cell: ({ row }) => <span className="font-medium text-xs">{row.original.customerName}</span>,
      }),

    createColumn<Order>({
      accessorKey: "status",
      header: "Statut",
      sortable: false,
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
            readOnly={!canEditOrders || isAdminOrSupervisor}
          />
        );
      },
    }),

    createColumn<Order>({
      accessorKey: "customerPhone",
      header: "Téléphone",
      sortable: false,
      cell: ({ row }) => row.original.customerPhone ?? "-",
    }),
    
    createColumn<Order>({
      accessorKey: "recallAt",
      header: "État du rappel",
      sortable: false,
      cell: ({ row }) => {
        const recallAt = row.original.recallAt;
        if (!recallAt) return <span className="text-gray-400 italic text-xs">-</span>;
        
        const date = new Date(recallAt);
        const now = new Date();

        if (isSameDay(date, now)) {
          return <span className="text-red-600 font-bold text-xs">À téléphoner</span>;
        }

        if (isPast(date)) {
          return <span className="text-gray-600 text-xs">Temps passé</span>;
        }

        if (differenceInDays(date, now) >= 1) {
          return <span className="text-blue-600 text-xs">Bientôt</span>;
        }

        return <span className="text-gray-600 text-xs">-</span>;
      },
    }),

    createColumn<Order>({
      id: "recallAtValue",
      header: "Date Rappel",
      sortable: false,
      accessorFn: (row) => row.recallAt,
      cell: ({ row }) => {
        return (
          <RecallCell
            order={row.original}
            onChange={onRecallChange}
            readOnly={!canEditOrders || isAdminOrSupervisor}
          />
        );
      },
    }),

    createColumn<Order>({
      accessorKey: "processingTimeMin",
      header: "Délai",
      sortable: false,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] whitespace-nowrap text-blue-600 bg-blue-50 border-blue-100">
          {formatDuration(row.original.processingTimeMin)}
        </Badge>
      ),
    }),
  ];
  
};
