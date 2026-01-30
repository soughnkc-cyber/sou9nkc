"use client";

import { ColumnDef } from "@tanstack/react-table";
import { createColumn, createActionsColumn, createSelectColumn } from "@/components/columns";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Clock } from "lucide-react";

export interface Status {
  id: string;
  name: string;
  color: string;
  recallAfterH?: number | null;
  createdAt: string;
}


const formatDateTime = (date: string) => {
  const d = new Date(date);
  return (
    d.toLocaleDateString("fr-FR") +
    " " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
};

const RecallBadge = ({ hours }: { hours?: number | null }) => {
  if (!hours) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
        Aucun rappel
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
      {hours}h
    </Badge>
  );
};

/* -------- Columns -------- */

export const getColumns = (
  onView?: (s: Status) => void,
  onEdit?: (s: Status) => void,
  onDelete?: (s: Status) => void
): ColumnDef<Status>[] => {
  const actions = [];
  if (onView)
    actions.push({ icon: Eye, onClick: onView, className: "text-blue-600 hover:text-blue-800" });
  if (onEdit)
    actions.push({ icon: Edit, onClick: onEdit, className: "text-blue-600 hover:text-blue-800" });
  if (onDelete)
    actions.push({ icon: Trash2, onClick: onDelete, className: "text-red-600 hover:text-red-800" });

  return [
    createSelectColumn<Status>(),
    createColumn<Status>({
      accessorKey: "name",
      header: "Nom du statut",
      isPrimary: true,
      sortable: false,
      cell: ({ row }) => (
        <span 
          className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm border border-black/5"
          style={{ backgroundColor: row.original.color || "#6366f1" }}
        >
          {row.original.name}
        </span>
      ),
    }),

    createColumn<Status>({
      accessorKey: "recallAfterH",
      header: "Rappel",
      isPrimary: true,
      sortable: false,
      cell: ({ row }) => (
        <RecallBadge hours={row.original.recallAfterH} />
      ),
    }),

    createColumn<Status>({
      accessorKey: "createdAt",
      header: "Créé le",
      sortable: false,
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    }),
  ];
};
