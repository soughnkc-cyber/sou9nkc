"use client";

import { ColumnDef } from "@tanstack/react-table";
import { createColumn, createActionsColumn } from "@/components/columns";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye } from "lucide-react";

/* -------- Types -------- */
export interface Product {
  id: string;
  title: string;
  vendor?: string | null;
  productType?: string | null;
  status: string;
  price: number;
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
    createColumn<Product>({
      accessorKey: "title",
      header: "Produit",
      sortable: true,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    }),

    createColumn<Product>({
      accessorKey: "vendor",
      header: "Fournisseur",
      sortable: true,
      cell: ({ row }) => row.original.vendor ?? "-",
    }),

    createColumn<Product>({
      accessorKey: "productType",
      header: "Type",
      sortable: true,
      cell: ({ row }) => row.original.productType ?? "-",
    }),

    createColumn<Product>({
      accessorKey: "price",
      header: "Prix",
      sortable: true,
      cell: ({ row }) => <PriceBadge price={row.original.price} />,
    }),

    createColumn<Product>({
      accessorKey: "status",
      header: "Statut",
      sortable: true,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    }),

    createColumn<Product>({
      accessorKey: "createdAt",
      header: "Créé le",
      sortable: true,
      cell: ({ row }) => formatDate(row.original.createdAt),
    }),

    ...(actions.length ? [createActionsColumn<Product>(actions)] : []),
  ];
};
