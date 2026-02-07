"use client";

import { ColumnDef } from "@tanstack/react-table";
import { createColumn, createSelectColumn } from "@/components/columns";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Status {
  id: string;
  name: string;
  etat: string;
  color: string;
  isActive: boolean;
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

const RecallBadge = ({ hours, t }: { hours?: number | null; t: any }) => {
  if (!hours) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
        {t('badges.noRecall')}
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

export const getColumns = (t: any): ColumnDef<Status>[] => {
  return [
    createSelectColumn<Status>(),
    createColumn<Status>({
      accessorKey: "name",
      header: t('columns.name'),
      isPrimary: true,
      sortable: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
           <span 
            className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm border border-black/5"
            style={{ backgroundColor: row.original.color || "#6366f1" }}
          >
            {row.original.name}
          </span>
          {!row.original.isActive && (
            <Badge variant="outline" className="text-gray-400 border-gray-200 text-[10px]">{t('badges.inactive')}</Badge>
          )}
        </div>
      ),
    }),

    createColumn<Status>({
      accessorKey: "recallAfterH",
      header: t('columns.recall'),
      isPrimary: true,
      sortable: false,
      cell: ({ row }) => (
        <RecallBadge hours={row.original.recallAfterH} t={t} />
      ),
    }),

    createColumn<Status>({
      accessorKey: "createdAt",
      header: t('columns.createdAt'),
      sortable: false,
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    }),
    createColumn<Status>({
     accessorKey: "isActive",
     header: t('columns.active'),
     sortable: false,
     cell: ({ row }) => (
       <Badge variant="outline" className={cn("text-gray-400 border-gray-200 text-[10px]", row.original.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
         {row.original.isActive ? t('badges.active') : t('badges.inactive')}
       </Badge>
     ),
    }),
  ];
};
