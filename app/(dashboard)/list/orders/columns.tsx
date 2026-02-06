import { ColumnDef, Table, Row } from "@tanstack/react-table";
import { createColumn, createActionsColumn, createFacetedFilter } from "@/components/columns";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, User as UserIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { RecallCell } from "@/components/recallAt";
import { differenceInDays, isSameDay, isPast, parseISO } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

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
    isActive?: boolean;
    etat?: string; // e.g. STATUS_15
  } | null;
  processingTimeMin?: number | null;
  recallAttempts?: number; // Added field
  createdAt: string;
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
  pendingStatusId,
}: {
  order: Order;
  statuses: { id: string; name: string; color?: string; isActive?: boolean; etat?: string }[];
  onChange: (orderId: string, statusId: string | null) => void;
  readOnly?: boolean;
  pendingStatusId?: string | null;
}) => {
  const currentStatusId = pendingStatusId !== undefined ? pendingStatusId : order.status?.id;
  const selectedStatus = statuses.find(s => s.id === currentStatusId);
  const isPending = pendingStatusId !== undefined;

  if (readOnly) {
    return (
      <div 
        className={cn(
          "h-7 w-[140px] text-xs font-medium flex items-center px-3 rounded-md transition-colors border-0 shadow-sm cursor-default",
          selectedStatus?.color ? "text-white" : "border border-input bg-background",
          isPending && "opacity-70 italic"
        )}
        style={{ 
          backgroundColor: selectedStatus?.color || undefined
        }}
      >
        <span className="truncate">{selectedStatus?.name || "Sélectionner"}</span>
      </div>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div 
            className={cn(
              "h-7 w-[140px] text-xs font-medium flex items-center px-3 rounded-md transition-colors border-0 shadow-sm cursor-pointer",
              selectedStatus?.color ? "text-white" : "border border-input bg-background",
              isPending && "ring-2 ring-yellow-400 opacity-90 italic"
            )}
            style={{ 
              backgroundColor: selectedStatus?.color || undefined
            }}
          >
            <span className="truncate">{selectedStatus?.name || "Sélectionner"}</span>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[140px]">
          {statuses
            .filter(s => s.isActive || s.id === order.status?.id)
            .map((s) => (
            <DropdownMenuItem 
              key={s.id} 
              onSelect={() => onChange(order.id, s.id)}
              className="text-xs"
            >
               <div className="flex items-center gap-2">
                 <span>{s.name}</span>
                 {!s.isActive && <span className="text-[10px] text-red-400">(Inactif)</span>}
               </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
    agents: { id: string; name: string; isActive: boolean; iconColor?: string }[];
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
            {agents
              .filter(a => a.isActive || a.id === order.agent?.id)
              .map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <div className="flex items-center gap-2">
                   <span>{a.name}</span>
                   {!a.isActive && <span className="text-[10px] text-red-400">(Inactif)</span>}
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
  <>
   {price.toLocaleString("fr-FR", { style: "currency", currency: "MRU" })}
  </>
);

export const getColumns = (
  role: string | undefined,
  canEditOrders: boolean,
  statuses: { id: string; name: string; color?: string; isActive?: boolean; etat?: string }[],
  agents: { id: string; name: string; isActive: boolean; iconColor?: string }[],
  productOptions: string[],
  priceOptions: number[],
  onStatusChange: (orderId: string, statusId: string | null) => void,
  onAgentChange: (orderId: string, agentId: string) => void,
  onRecallChange: (orderId: string, date: string | null) => void,
  onView?: (o: Order) => void,
  onEdit?: (o: Order) => void,
  onDelete?: (o: Order) => void,
  onInteractionStart?: () => void,
  onInteractionEnd?: () => void,
  pendingUpdates?: Record<string, { statusId?: string | null, recallAt?: string | null }>
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


  const isAgent = role === "AGENT" || role === "AGENT_TEST";

  const columnDefs: (ColumnDef<Order> | null)[] = [
    !isAgent ? {
      id: "select",
      header: ({ table }: { table: Table<Order> }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Sélectionner tout"
        />
      ),
      cell: ({ row }: { row: Row<Order> }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Sélectionner la ligne"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    } : null,
    
    createColumn<Order>({
      accessorKey: "orderNumber",
      header: "N°",
      isPrimary: true,
      sortable: false,
      hideMobileLabel: true,
      cell: ({ row }: { row: Row<Order> }) => <span className="font-medium text-xs">#{row.original.orderNumber}</span>,
    }),

     createColumn<Order>({
      accessorKey: "orderDate",
      header: "Date Commande",
      sortable: false,
      hideMobileLabel: true,
      cell: ({ row }: { row: Row<Order> }) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(row.original.orderDate)}</span>,
    }),

    createColumn<Order>({
      accessorKey: "productNote",
      header: "Produit(s)",
      sortable: false,
      isPrimary: true, // Make primary for mobile header
      hideMobileLabel: true,
      filterComponent: createFacetedFilter(
        "Produit",
        productOptions.map((p) => ({ label: p, value: p }))
      ),
      accessorFn: (row) => row.productNote, // For filtering
      cell: ({ row }: { row: Row<Order> }) => <span className="text-xs">{row.original.productNote ?? "-"}</span>,
    }),

    
    createColumn<Order>({
      accessorKey: "totalPrice",
      header: "Prix",
      isPrimary: false, // Move to body
      sortable: false,
      hideMobileLabel: true,
      filterComponent: createFacetedFilter(
        "Prix",
        priceOptions.map((p) => ({ label: `${p}`, value: p.toString() }))
      ),
      accessorFn: (row) => row.totalPrice.toString(),
      cell: ({ row }: { row: Row<Order> }) => <PriceBadge price={row.original.totalPrice} />,
    }),


    createColumn<Order>({
      accessorKey: "customerName",
      header: "Client",
      sortable: false,
      hideMobileLabel: true,
      cell: ({ row }: { row: Row<Order> }) => <span className="text-xs">{row.original.customerName}</span>,
    }),

    createColumn<Order>({
      accessorKey: "customerPhone",
      header: "Téléphone",
      sortable: false,
      hideMobileLabel: true,
      cell: ({ row }: { row: Row<Order> }) => (
        row.original.customerPhone ? (
          <a 
            href={`tel:${row.original.customerPhone}`} 
            className="text-[#1F30AD] hover:underline transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.customerPhone}
          </a>
        ) : "-"
      ),
    }),


    isAdminOrSupervisor
      ? createColumn<Order>({
          accessorKey: "agent",
          header: "Agent",
          sortable: false,
          hideMobileLabel: true,
          accessorFn: (row) => row.agent?.name || "Non affecté", 
          filterComponent: createFacetedFilter(
             "Agent",
             agents.map(a => ({ label: a.name, value: a.name }))
          ),
          cell: ({ row }: { row: Row<Order> }) => (
             <AgentSelect 
                order={row.original} 
                agents={agents} 
                onChange={onAgentChange} 
                readOnly={!isAdminOrSupervisor} 
             />
          ),
        })
      : null,

    createColumn<Order>({
      accessorKey: "status",
      header: "Statut",
      sortable: false,
      isPrimary: true,
      mobilePosition: "right",
      hideMobileLabel: true,
      filterComponent: createFacetedFilter(
        "Statut",
        statuses
          .filter(s => s.isActive)
          .map((s) => ({ label: s.name, value: s.name }))
      ),
      accessorFn: (row) => row.status?.name,
      cell: ({ row }: { row: Row<Order> }) => {
        const pending = pendingUpdates?.[row.original.id];
        return (
          <StatusSelect
            order={row.original}
            statuses={statuses}
            onChange={onStatusChange}
            readOnly={!canEditOrders || isAdminOrSupervisor}
            pendingStatusId={pending?.statusId}
          />
        );
      },
    }),


    createColumn<Order>({
      id: "recallStatus",
      header: "État Rappel",
      sortable: false,
      hideOnMobile: true,
      cell: ({ row }: { row: Row<Order> }) => {
        const recallAt = row.original.recallAt;
        if (!recallAt || !isPast(new Date(recallAt))) return null;
        return (
          <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 w-fit leading-none font-bold uppercase tracking-tighter">
            À rappeler
          </Badge>
        );
      },
    }),
    createColumn<Order>({
      id: "recallAtValue",
      header: "Date Rappel",
      sortable: false,
      accessorFn: (row) => row.recallAt,
      cell: ({ row }: { row: Row<Order> }) => {
        const pending = pendingUpdates?.[row.original.id];
        return (
          <RecallCell
            order={row.original}
            onChange={onRecallChange}
            readOnly={!canEditOrders || isAdminOrSupervisor}
            onInteractionStart={onInteractionStart}
            onInteractionEnd={onInteractionEnd}
            pendingRecallAt={pending?.recallAt}
          />
        );
      },
    }),

    createColumn<Order>({
      accessorKey: "processingTimeMin",
      header: "Délai",
      sortable: false,
      cell: ({ row }: { row: Row<Order> }) => (
        <p className="whitespace-nowrap">
          {formatDuration(row.original.processingTimeMin)}
        </p>
      ),
    }),

     createColumn<Order>({
       accessorKey: "recallAttempts",
       header: "Cpt",
       sortable: false,
       cell: ({ row }) => (
         <p className="flex items-center justify-start p-0 border-gray-300 text-gray-600">
            {row.original.recallAttempts || 0}
         </p>
       )
    }),
    
    

    

    createActionsColumn(actions),
  ];

  return columnDefs.filter(Boolean) as ColumnDef<Order>[];
  
};
