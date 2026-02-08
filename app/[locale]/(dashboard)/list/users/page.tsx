"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { DataTable } from "@/components/datatable";
import { Button } from "@/components/ui/button";
import { Plus, Users, ShieldCheck, RefreshCw, Edit } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

/* Actions */
import { getUsers, toggleUserStatus, createUserAction, updateUserAction, deleteUserAction, getMe } from "@/lib/actions/users";
import { getColumns, User } from "./columns";
import { UserFormModal } from "@/components/forms/user-form-modal";
import PermissionDenied from "@/components/permission-denied";
import { cn } from "@/lib/utils";
import { UserFormData } from "@/lib/schema";

export default function UsersPage() {
  const t = useTranslations('Users');
  const locale = useLocale();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedRows, setSelectedRows] = useState<User[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();

  const fetchUsers = useCallback(async () => {
    setIsLoadingPage(true);
    try {
      const data = await getUsers();
      setUsers(data as any);
    } catch (error) {
      console.error(error);
      toast.error(t('errorLoading'));
    } finally {
      setIsLoadingPage(false);
    }
  }, [t]);

  useEffect(() => {
    getMe().then(user => {
      if (user?.canViewUsers) {
        setHasPermission(true);
        fetchUsers();
      } else {
        setHasPermission(false);
      }
    });
  }, [fetchUsers]);

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatus(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      toast.success(t('statusUpdated'));
    } catch (error) {
      console.error(error);
      toast.error(t('updateError'));
    }
  };

  const handleSubmit = async (data: UserFormData) => {
    setIsLoadingPage(true);
    try {
        if (editingUser) {
            await updateUserAction(editingUser.id, data);
            toast.success(t('updateSuccess'));
        } else {
            await createUserAction(data);
            toast.success(t('createSuccess'));
        }
        setIsFormOpen(false);
        fetchUsers();
    } catch (error: any) {
        toast.error(error.message || t('updateError'));
    } finally {
        setIsLoadingPage(false);
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    return { total, active };
  }, [users]);

  const columns = useMemo(
    () => getColumns(
        handleToggleStatus, 
        t, 
        locale,
        undefined, 
        (u) => {
            setEditingUser(u);
            setIsFormOpen(true);
        }
    ),
    [t, locale]
  );

  const StatCard = ({ title, value, icon: Icon, color, bgColor }: any) => (
    <Card 
       style={{ backgroundColor: bgColor }}
       className="relative p-4 border-none shadow-none rounded-2xl overflow-hidden flex flex-col h-full min-h-[90px] gap-1"
    >
      <div className="flex justify-between items-start mb-1">
        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest opacity-80">{title}</p>
        <div className={cn("p-1.5 rounded-lg", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{value}</h3>
    </Card>
  );


  if (hasPermission === false) return <PermissionDenied />;
  if (hasPermission === null) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title={t('totalUsers')}
          value={stats.total.toLocaleString("fr-FR")}
          icon={Users}
          bgColor="#e3f0ff"
          color="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title={t('activeUsers')}
          value={stats.active.toLocaleString("fr-FR")}
          icon={ShieldCheck}
          bgColor="#e3ffef"
          color="bg-emerald-500/10 text-emerald-600"
        />
      </div>

      <div className="bg-white rounded-3xl p-2 border border-gray-100 shadow-sm">
        <DataTable<User, unknown>
          columns={columns}
          data={users}
          onSelectionChange={setSelectedRows}
          searchPlaceholder={t('searchPlaceholder')}
          pageSizeOptions={[10, 20, 50]}
          defaultPageSize={10}
          showSearch
          showPagination
          rightHeaderActions={
             <div className="flex items-center gap-2">
                 {selectedRows.length === 1 && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 rounded-xl font-bold border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100"
                        onClick={() => {
                            setEditingUser(selectedRows[0]);
                            setIsFormOpen(true);
                        }}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        {t('editBtn')}
                    </Button>
                 )}

                 <Button 
                    size="sm" 
                    className="h-9 rounded-xl font-bold bg-[#1F30AD] hover:bg-[#1F30AD]/90 text-white shadow-lg shadow-blue-100"
                    onClick={() => {
                        setEditingUser(undefined);
                        setIsFormOpen(true);
                    }}
                 >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addBtn')}
                 </Button>
             </div>
          }
        />
      </div>

      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        user={editingUser as any}
        isLoading={isLoadingPage}
      />
    </div>
  );
}
