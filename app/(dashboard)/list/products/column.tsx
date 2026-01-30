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
const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
};

const PriceBadge = ({ price }: { price: number }) => (
  <Badge variant="secondary" className="bg-green-100 text-green-800">
    {price.toLocaleString("fr-FR", {
      style: "currency",
      currency: "MRU",
    })}
  </Badge>
);

const StatusBadge = ({ status }: { status: string }) => (
  <Badge
    variant="secondary"
    className={
      status === "active"
        ? "bg-blue-100 text-blue-800"
        : "bg-gray-100 text-gray-800"
    }
  >
    {status}
  </Badge>
);

/* -------- Columns -------- */
export const getColumns = (
  agents: Option[],
  onUpdateAgents: (productId: string, data: { assignedAgentIds?: string[]; hiddenForAgentIds?: string[] }) => void,
  canEditProducts: boolean,
  onView?: (p: Product) => void,
  onEdit?: (p: Product) => void,
  onDelete?: (p: Product) => void
): ColumnDef<Product>[] => {
  const actions = [];

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
      header: "Produit",
      isPrimary: true,
      sortable: true,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    }),

    createColumn<Product>({
      accessorKey: "assignedAgentIds",
      header: "Assigné à",
      filterFn: "arrIncludesSome",
      filterComponent: createFacetedFilter(
        "Agents assignés",
        agents.map((a) => ({ label: a.name, value: a.id }))
      ),
      cell: ({ row }) => (
        <AgentSelect
          options={agents}
          selected={row.original.assignedAgentIds || []}
          onChange={(selected) => onUpdateAgents(row.original.id, { assignedAgentIds: selected })}
          placeholder="Agents assignés"
          disabled={!canEditProducts}
        />
      ),
    }),

    createColumn<Product>({
      accessorKey: "hiddenForAgentIds",
      header: "Caché pour",
      filterFn: "arrIncludesSome",
      filterComponent: createFacetedFilter(
        "Agents restreints",
        agents.map((a) => ({ label: a.name, value: a.id }))
      ),
      cell: ({ row }) => (
        <AgentSelect
          options={agents}
          selected={row.original.hiddenForAgentIds || []}
          onChange={(selected) => onUpdateAgents(row.original.id, { hiddenForAgentIds: selected })}
          placeholder="Agents restreints"
          disabled={!canEditProducts}
        />
      ),
    }),

    createColumn<Product>({
      accessorKey: "price",
      header: "Prix",
      isPrimary: true,
      sortable: true,
      cell: ({ row }) => <PriceBadge price={row.original.price} />,
    }),

    createColumn<Product>({
      accessorKey: "status",
      header: "Statut",
      sortable: true,
      filterComponent: createFacetedFilter("Statut", [
        { label: "Actif", value: "active" },
        { label: "Archivé", value: "archived" },
        { label: "Brouillon", value: "draft" },
      ]),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    }),
  ];
};
