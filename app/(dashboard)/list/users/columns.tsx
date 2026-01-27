"use client";

import { ColumnDef } from "@tanstack/react-table";
import { createColumn, createActionsColumn, createFacetedFilter } from "@/components/columns";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, User as UserIcon, ShieldAlertIcon } from "lucide-react";
import { Role } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";

export interface User {
  id: string;
  name: string | "";
  phone?: string;
  role: Role;
  createdAt: string;
  lastLogin?: string;
  lastLogout?: string;
  status?: "ONLINE" | "OFFLINE";
  isActive: boolean;
  email?: string;
}

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrateur" },
  { value: "AGENT", label: "Agent" },
  { value: "SUPERVISOR", label: "Superviseur" },
  { value: "AGENT_TEST", label: "Agent Test" },
];

const STATUS_OPTIONS = [
  { value: "ONLINE", label: "En ligne" },
  { value: "OFFLINE", label: "Hors ligne" },
];

export const RoleFilter = createFacetedFilter<User>("Rôle", ROLE_OPTIONS);
export const StatusFilter = createFacetedFilter<User>("Statut", STATUS_OPTIONS);

const formatDateTime = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const SessionBadge = ({ status }: { status?: "ONLINE" | "OFFLINE" }) => {
  const map = {
    ONLINE: "bg-green-100 text-green-600 border-green-200",
    OFFLINE: "bg-gray-100 text-gray-400 border-gray-200",
  };
  const label = {
    ONLINE: "Connecté",
    OFFLINE: "Déconnecté",
  };
  return <Badge variant="outline" className={cn("text-[10px] font-bold", map[status ?? "OFFLINE"])}>{label[status ?? "OFFLINE"]}</Badge>;
};

const AccountStatusToggle = ({ 
  user, 
  onToggle 
}: { 
  user: User; 
  onToggle: (id: string) => void 
}) => {
  return (
    <div 
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
        user.isActive ? "bg-green-500" : "bg-gray-200"
      )}
      onClick={() => onToggle(user.id)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          user.isActive ? "translate-x-4" : "translate-x-0"
        )}
      />
    </div>
  );
};

const RoleBadge = ({ role }: { role: Role }) => {
  const map = {
    ADMIN: "bg-purple-100 text-purple-800",
    AGENT: "bg-blue-100 text-blue-800",
    SUPERVISOR: "bg-orange-100 text-orange-800",
    AGENT_TEST: "bg-gray-100 text-gray-800",
  };
  const label = {
    ADMIN: "Admin",
    AGENT: "Agent",
    SUPERVISOR: "Superviseur",
    AGENT_TEST: "Agent Test",
  };
  return <Badge variant="secondary" className={map[role]}>{label[role]}</Badge>;
};

export const getColumns = (
  onToggleStatus: (u: User) => void,
  onView?: (u: User) => void,
  onEdit?: (u: User) => void,
  onDelete?: (u: User) => void
): ColumnDef<User>[] => {
  const actions = [];
  if (onView) actions.push({ icon: Eye, onClick: onView, className: "text-blue-600 hover:text-blue-800" });
  if (onEdit) actions.push({ icon: Edit, onClick: onEdit, className: "text-blue-600 hover:text-blue-800" });
  if (onDelete) actions.push({ icon: Trash2, onClick: onDelete, className: "text-red-600 hover:text-red-800" });

  return [
    createColumn<User>({
      accessorKey: "name",
      header: "Nom",
      sortable: true,
      cell: ({ row }) => (
        <div className="flex gap-3 items-center">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-gray-500 truncate max-w-[200px]">
              {row.original.phone ?? "Pas de téléphone"}
            </div>
          </div>
        </div>
      ),
    }),
    createColumn<User>({
      accessorKey: "phone",
      header: "Téléphone",
      cell: ({ row }) =>
        row.original.phone ? <span className="font-mono">{row.original.phone}</span> : "Non renseigné",
    }),
    createColumn<User>({
      accessorKey: "role",
      header: "Rôle",
      sortable: true,
      filterComponent: RoleFilter,
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    }),
    createColumn<User>({
      accessorKey: "isActive",
      header: "Compte",
      sortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
            <AccountStatusToggle user={row.original} onToggle={() => onToggleStatus(row.original)} />
            <span className={cn("text-[10px] font-bold uppercase", row.original.isActive ? "text-green-600" : "text-gray-400")}>
                {row.original.isActive ? "Actif" : "Bloqué"}
            </span>
        </div>
      ),
    }),
    createColumn<User>({
      accessorKey: "status",
      header: "Session",
      sortable: true,
      filterComponent: StatusFilter,
      cell: ({ row }) => <SessionBadge status={row.original.status} />,
    }),
    createColumn<User>({
      accessorKey: "createdAt",
      header: "Créé le",
      sortable: true,
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    }),
    createColumn<User>({
      accessorKey: "lastLogin",
      header: "Dernière connexion",
      cell: ({ row }) =>
        row.original.lastLogin ? formatDateTime(row.original.lastLogin) : "Jamais",
    }),
    createColumn<User>({
      accessorKey: "lastLogout",
      header: "Dernière déconnexion",
      cell: ({ row }) =>
        row.original.lastLogout ? formatDateTime(row.original.lastLogout) : "-",
    }),

    ...(actions.length ? [createActionsColumn<User>(actions)] : []),
  ];
};
