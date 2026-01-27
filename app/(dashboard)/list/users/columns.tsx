"use client";

import { ColumnDef } from "@tanstack/react-table";
import { createColumn, createActionsColumn, createSelectFilter } from "@/components/columns";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, User as UserIcon } from "lucide-react";
import { Role } from "@/app/generated/prisma/enums";

export interface User {
  id: string;
  name: string | "";
  phone?: string;
  role: Role;
  createdAt: string;
  lastLogin?: string;
  lastLogout?: string;
  status?: "ONLINE" | "OFFLINE";
}


const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrateur" },
  { value: "AGENT", label: "Agent" },
  { value: "SUPERVISOR", label: "Superviseur" },
  { value: "AGENT_TEST", label: "Agent Test" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Actif" },
  { value: "INACTIVE", label: "Inactif" },
];


export const RoleFilter = createSelectFilter<User>(ROLE_OPTIONS);
export const StatusFilter = createSelectFilter<User>(STATUS_OPTIONS);


const formatDateTime = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};


const StatusBadge = ({ status }: { status?: "ONLINE" | "OFFLINE" }) => {
  const map = {
    ONLINE: "bg-green-100 text-green-800",
    OFFLINE: "bg-red-100 text-red-800",
  };
  const label = {
    ONLINE: "Active",
    OFFLINE: "Inactif",
  };
  return <Badge variant="secondary" className={map[status ?? "OFFLINE"]}>{label[status ?? "OFFLINE"]}</Badge>;
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
              {row.original.email ?? "Non renseigné"}
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
      accessorKey: "status",
      header: "Statut",
      sortable: true,
      filterComponent: StatusFilter,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
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

// export const mockUsers: User[] = [
//   {
//     id: "1",
//     name: "Mohamed Ali",
//     phone: "+212 6 12 34 56 78",
//     role: "ADMIN",
//     status: "active",
//     createdAt: "2024-01-15",
//     lastLogin: "2024-03-20",
//   },
//   {
//     id: "2",
//     name: "Fatima Zahra",
//     role: "AGENT",
//     status: "active",
//     createdAt: "2024-02-10",
//   },
// ];
