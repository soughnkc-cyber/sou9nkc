"use client";

import { ColumnDef } from "@tanstack/react-table";
import { createColumn, createActionsColumn, createFacetedFilter, createSelectColumn } from "@/components/columns";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, User as UserIcon } from "lucide-react";
import { Role } from "@/app/generated/prisma";
import { cn } from "@/lib/utils";

export interface User {
  id: string;
  name: string | "";
  phone?: string;
  role: Role;
  createdAt: string;
  lastLogin?: string;
  lastLogout?: string;
  lastSeenAt?: string;
  status?: "ONLINE" | "OFFLINE";
  isActive: boolean;
  email?: string;
  iconColor: string;
  roleColor: string;
  paymentRemainingDays: number;
  paymentDefaultDays: number;
  // Permissions
  canViewOrders: boolean;
  canEditOrders: boolean;
  canViewUsers: boolean;
  canEditUsers: boolean;
  canViewProducts: boolean;
  canEditProducts: boolean;
  canViewStatuses: boolean;
  canEditStatuses: boolean;
  canViewReporting: boolean;
  canViewDashboard: boolean;
  decryptedPassword?: string;
}

const formatDateTime = (date: string | null | undefined) => {
  if (!date) return "-";
  const d = new Date(date);
  return (
    d.toLocaleDateString("fr-FR") +
    " " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
};


const SessionBadge = ({ status, t }: { status?: "ONLINE" | "OFFLINE"; t: any }) => {
  const map = {
    ONLINE: "bg-green-100 text-green-600 border-green-200",
    OFFLINE: "bg-red-100 text-red-600 border-red-200",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] font-bold", map[status ?? "OFFLINE"])}>
      {status === 'ONLINE' ? t('online') : t('offline')}
    </Badge>
  );
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
      dir="ltr"
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
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

const RoleBadge = ({ role, color, t }: { role: Role; color: string; t: any }) => {
  return (
    <Badge 
      variant="secondary" 
      style={{ backgroundColor: color }}
      className="text-gray-800"
    >
      {t(`roles.${role}`)}
    </Badge>
  );
};


export const getColumns = (
  onToggleStatus: (u: User) => void,
  t: any,
  locale: string,
  onView?: (u: User) => void,
  onEdit?: (u: User) => void
): ColumnDef<User>[] => {

  const actions = [];
  if (onView) actions.push({ icon: Eye, onClick: onView, className: "text-blue-600 hover:text-blue-800" });
  if (onEdit) actions.push({ icon: Edit, onClick: onEdit, className: "text-blue-600 hover:text-blue-800" });

  return [
    createSelectColumn<User>(),
    createColumn<User>({
      accessorKey: "name",
      header: t('user'),
      isPrimary: true,
      sortable: true,
      hideSortIcon: true,
      cell: ({ row }) => (
        <div className="flex gap-3 items-center">
          <div 
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: row.original.iconColor || "#2563eb" }}
          >
            <UserIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-gray-500 truncate max-w-[200px]">
              {row.original.phone ?? t('noPhone')}
            </div>
          </div>
        </div>
      ),
    }),

    createColumn<User>({
      accessorKey: "role",
      header: t('role'),
      isPrimary: true,
      mobilePosition: "right",
      sortable: true,
      hideSortIcon: true,
      filterComponent: createFacetedFilter(t('role'), [
        { value: "ADMIN", label: "ADMIN" },
        { value: "AGENT", label: "AGENT" },
        { value: "SUPERVISOR", label: "SUPERVISOR" },
        { value: "AGENT_TEST", label: "AGENT_TEST" },
      ]),
      cell: ({ row }) => <RoleBadge role={row.original.role} color={row.original.roleColor} t={t} />,
    }),


    createColumn<User>({
      accessorKey: "isActive",
      header: t('account'),
      sortable: true,
      hideSortIcon: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
            <AccountStatusToggle user={row.original} onToggle={() => onToggleStatus(row.original)} />
        </div>
      ),
    }),
    createColumn<User>({
      accessorKey: "status",
      header: t('session'),
      sortable: true,
      hideSortIcon: true,
      filterComponent: createFacetedFilter(t('session'), [
        { value: "ONLINE", label: "ONLINE" },
        { value: "OFFLINE", label: "OFFLINE" },
      ]),
      cell: ({ row }) => <SessionBadge status={row.original.status} t={t} />,
    }),

    createColumn<User>({
      accessorKey: "lastLogin",
      header: t('connection'),
      cell: ({ row }) => formatDateTime(row.original.lastLogin),
    }),
    createColumn<User>({
      accessorKey: "lastLogout",
      header: t('disconnection'),
      cell: ({ row }) => formatDateTime(row.original.lastLogout),
    }),
    createColumn<User>({
      accessorKey: "paymentRemainingDays",
      header: t('payment'),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold text-xs",
            row.original.paymentRemainingDays <= 2 ? "text-red-600" : "text-gray-700"
          )}>
            {row.original.paymentRemainingDays} {t('days')}
          </span>
          <span className="text-[10px] text-gray-400">{t('on')} {row.original.paymentDefaultDays}</span>
        </div>
      ),
    }),
    createActionsColumn<User>(actions),
  ];
};
