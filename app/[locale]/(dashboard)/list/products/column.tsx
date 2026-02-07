"use client";

import { ColumnDef } from "@tanstack/react-table";
import { createColumn, createActionsColumn, createFacetedFilter, createSelectColumn } from "@/components/columns";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye } from "lucide-react";
import { AgentSelect, Option } from "./agent-select";

/* -------- Types -------- */
export interface Product {
  id: string;
  title: string;
  vendor?: string | null;
  productType?: string | null;
  status: string;
  price: number;
  assignedAgentIds: string[];
  hiddenForAgentIds: string[];
  createdAt: string;
}

/* -------- Helpers -------- */
const formatDate = (date: string | null) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const PriceBadge = ({ price }: { price: number }) => (
  <Badge variant="secondary" className="bg-green-100 text-green-800">
    {price.toLocaleString("fr-FR", {
      style: "currency",
      currency: "MRU",
    })}
  </Badge>
);

const StatusBadge = ({ status, t }: { status: string; t: any }) => (
  <Badge
    variant="secondary"
    className={
      status === "active"
        ? "bg-blue-100 text-blue-800"
        : "bg-gray-100 text-gray-800"
    }
  >
    {t(status)}
  </Badge>
);

/* -------- Columns -------- */
export const getColumns = (
  agents: Option[],
  onUpdateAgents: (productId: string, data: { assignedAgentIds?: string[]; hiddenForAgentIds?: string[] }) => void,
  canEditProducts: boolean,
  t: any,
  locale: string,
  onView?: (p: Product) => void,
  onEdit?: (p: Product) => void,
  onDelete?: (p: Product) => void
): ColumnDef<Product>[] => {
  const actions = [];
  // ... (keeping actions logic)
  if (onView)
    actions.push({
      icon: Eye,
      onClick: onView,
      className: "text-blue-600 hover:text-blue-800",
    });

  if (onEdit)
    actions.push({
      icon: Edit,
      onClick: onEdit,
      className: "text-blue-600 hover:text-blue-800",
    });

  if (onDelete)
    actions.push({
      icon: Trash2,
      onClick: onDelete,
      className: "text-red-600 hover:text-red-800",
    });

  return [
    createSelectColumn<Product>(),
    createColumn<Product>({
      accessorKey: "title",
      header: t('product'),
      isPrimary: true,
      sortable: false,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    }),

    createColumn<Product>({
      accessorKey: "assignedAgentIds",
      header: t('assignedTo'),
      filterFn: "arrIncludesSome",
      filterComponent: createFacetedFilter(
        t('assignedAgents'),
        agents.map((a) => ({ label: a.name, value: a.id }))
      ),
      cell: ({ row }) => (
        <AgentSelect
          options={agents}
          selected={row.original.assignedAgentIds || []}
          onChange={(selected) => onUpdateAgents(row.original.id, { assignedAgentIds: selected })}
          placeholder={t('assignedAgents')}
          disabled={!canEditProducts}
        />
      ),
    }),

    createColumn<Product>({
      accessorKey: "hiddenForAgentIds",
      header: t('hiddenFor'),
      filterFn: "arrIncludesSome",
      filterComponent: createFacetedFilter(
        t('restrictedAgents'),
        agents.map((a) => ({ label: a.name, value: a.id }))
      ),
      cell: ({ row }) => (
        <AgentSelect
          options={agents}
          selected={row.original.hiddenForAgentIds || []}
          onChange={(selected) => onUpdateAgents(row.original.id, { hiddenForAgentIds: selected })}
          placeholder={t('restrictedAgents')}
          disabled={!canEditProducts}
        />
      ),
    }),

    createColumn<Product>({
      accessorKey: "price",
      header: t('price'),
      isPrimary: true,
      sortable: false,
      cell: ({ row }) => <PriceBadge price={row.original.price} />,
    }),

    createColumn<Product>({
      accessorKey: "status",
      header: t('status'),
      sortable: false,
      filterComponent: createFacetedFilter(t('status'), [
        { label: "active", value: "active" },
        { label: "archived", value: "archived" },
        { label: "draft", value: "draft" },
      ]),
      cell: ({ row }) => <StatusBadge status={row.original.status} t={t} />,
    }),

    createColumn<Product>({
      accessorKey: "createdAt",
      header: t('date'),
      cell: ({ row }) => formatDate(row.original.createdAt),
    }),

    createActionsColumn<Product>(actions),
  ];
};
