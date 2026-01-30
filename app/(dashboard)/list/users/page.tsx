// app/admin/users/page.tsx
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { DataTable } from "@/components/datatable";
import { getColumns, User } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Trash2, Edit, Users, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useModal } from "@/hooks/use-modal";
import { UserFormData } from "@/lib/schema";
import { UserFormModal } from "@/components/forms/user-form-modal";
import { DeleteUserModal } from "@/components/delete-modal";
import { toast } from "sonner";
import { getUsers, createUserAction, updateUserAction, deleteUserAction, deleteUsersAction, toggleUserStatus, getMe } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";
import { cn } from "@/lib/utils";


const percent = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

const getUserStats = (users: User[]) => ({
  total: users.length,
  active: users.filter((u) => u.isActive).length,
  inactive: users.filter((u) => !u.isActive).length,
  byRole: {
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    AGENT: users.filter((u) => u.role === "AGENT").length,
    SUPERVISOR: users.filter((u) => u.role === "SUPERVISOR").length,
    AGENT_TEST: users.filter((u) => u.role === "AGENT_TEST").length,
  },
});


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRows, setSelectedRows] = useState<User[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);



  // Modals
  const addModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  // Fetch users via server action
  const fetchUsers = useCallback(async () => {
    setIsLoadingPage(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setIsLoadingPage(false);
    }
  }, []);

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


  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    editModal.openModal();
  }, [editModal]);

  const handleDeleteUser = useCallback((user: User) => {
    setSelectedUser(user);
    deleteModal.openModal();
  }, [deleteModal]);

  const handleAddUser = useCallback(() => {
    setSelectedUser(null);
    addModal.openModal();
  }, [addModal]);

  const handleRefresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  // CRUD Handlers using server actions
  const handleCreateUser = useCallback(async (data: UserFormData) => {
    try {
      addModal.setLoading(true);
      const newUser = await createUserAction(data);
      setUsers(prev => [newUser, ...prev]);
      addModal.closeModal();
      toast.success("Utilisateur créé avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de la création:", error);
      toast.error(error.message || "Erreur lors de la création de l'utilisateur");
    } finally {
      addModal.setLoading(false);
    }
  }, [addModal]);

  const handleUpdateUser = useCallback(async (data: UserFormData) => {
    if (!selectedUser) return;
    try {
      editModal.setLoading(true);

      const updateData = { ...data };
      if (!updateData.password) delete updateData.password;

      const updatedUser = await updateUserAction(selectedUser.id, updateData);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
      editModal.closeModal();
      toast.success("Utilisateur modifié avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de la modification:", error);
      toast.error(error.message || "Erreur lors de la modification de l'utilisateur");
    } finally {
      editModal.setLoading(false);
    }
  }, [selectedUser, editModal]);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedRows.length > 0) {
      // Suppression groupée
      try {
        deleteModal.setLoading(true);
        await deleteUsersAction(selectedRows.map(u => u.id));
        setUsers(prev => prev.filter(u => !selectedRows.find(sr => sr.id === u.id)));
        deleteModal.closeModal();
        setSelectedRows([]);
        toast.success(`${selectedRows.length} utilisateurs supprimés avec succès !`);
      } catch (error: any) {
        console.error("Erreur lors de la suppression groupée:", error);
        toast.error(error.message || "Erreur lors de la suppression des utilisateurs");
      } finally {
        deleteModal.setLoading(false);
      }
      return;
    }

    if (!selectedUser) return;
    try {
      deleteModal.setLoading(true);
      await deleteUserAction(selectedUser.id);
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      deleteModal.closeModal();
      toast.success("Utilisateur supprimé avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      toast.error(error.message || "Erreur lors de la suppression de l'utilisateur");
    } finally {
      deleteModal.setLoading(false);
    }
  }, [selectedUser, selectedRows, deleteModal]);

  const handleBulkDelete = useCallback(() => {
    if (selectedRows.length === 0) return;
    deleteModal.openModal();
  }, [selectedRows, deleteModal]);


  const handleToggleStatus = useCallback(async (user: User) => {
    try {
      const updated = await toggleUserStatus(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: updated.status === "ACTIVE" } : u));
      toast.success(`Le compte de ${user.name} a été ${updated.status === "ACTIVE" ? "activé" : "désactivé"}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  const stats = useMemo(() => getUserStats(users), [users]);
  const columns = useMemo(() => getColumns(handleToggleStatus, undefined, handleEditUser), [
    handleToggleStatus,
    handleEditUser,
  ]);



  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color,
    description
  }: { 
    title: string; 
    value: number | string; 
    icon?: any;
    color?: string;
    description?: React.ReactNode;
  }) => (
    <Card className="relative p-4 sm:p-5 transition-all duration-300 border border-gray-100 shadow-xs hover:shadow-md rounded-2xl overflow-hidden group bg-white flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gray-50 group-hover:bg-blue-50 transition-colors", color)}>
          {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
        </div>
      </div>
      <div>
        <p className="text-[8px] sm:text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">{title}</p>
        <h3 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">{value}</h3>
        {description && <div className="mt-2">{description}</div>}
      </div>
    </Card>
  );

  if (hasPermission === false) return <PermissionDenied />;
  if (hasPermission === null) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-end items-center gap-4 sm:gap-6">
        {/* <div className="text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">Utilisateurs</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Gestion des utilisateurs et permissions</p>
        </div> */}

        <div className="flex items-center justify-center w-full md:w-auto gap-2 sm:gap-3">
            <Button 
                variant="outline" 
                size="sm" 
                className="h-10 rounded-xl px-3 sm:px-4 font-bold border-gray-200 hover:bg-blue-50 hover:text-[#1F30AD] hover:border-blue-200 shrink-0" 
                onClick={handleRefresh} 
                disabled={isLoadingPage || addModal.isLoading || editModal.isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 sm:mr-2", isLoadingPage && "animate-spin")} />
              <span className="hidden sm:inline">Rafraîchir</span>
            </Button>

            <Button 
              size="sm" 
              onClick={handleAddUser} 
              className="h-10 rounded-xl px-4 font-bold bg-[#1F30AD] hover:bg-[#172585] text-white shrink-0 shadow-lg shadow-blue-100 transition-all"
              disabled={addModal.isLoading || editModal.isLoading || deleteModal.isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
        </div>
      </div>

      {/* Statistiques */}
      {users.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
          <StatCard
            title="Total Utilisateurs"
            value={stats.total}
            icon={Users}
            color="bg-blue-50"
            description={
              <div className="flex flex-wrap gap-1">
                <span className="text-[8px] uppercase font-bold text-gray-400">{stats.byRole.ADMIN} Adm</span>
                <span className="text-[8px] uppercase font-bold text-gray-400">{stats.byRole.AGENT} Agt</span>
              </div>
            }
          />

          <StatCard
            title="Utilisateurs Actifs"
            value={stats.active}
            icon={UserCheck}
            color="bg-green-50"
            description={
              <div className="text-[10px] font-bold text-green-600">
                {percent(stats.active, stats.total)}% du total
              </div>
            }
          />

          <StatCard
            title="Utilisateurs Inactifs"
            value={stats.inactive}
            icon={UserX}
            color="bg-red-50"
            description={
              <div className="text-[10px] font-bold text-red-600">
                {percent(stats.inactive, stats.total)}% du total
              </div>
            }
          />
        </div>
      )}

      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            {stats.total} utilisateurs •{" "}
            <span className="text-green-600">{stats.active} actifs</span> •{" "}
            <span className="text-red-600">{stats.inactive} inactifs</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <DataTable<User, unknown>
            columns={columns}
            data={users}
            onSelectionChange={setSelectedRows}
            extraSearchActions={
              <div className="flex items-center gap-2">
                {selectedRows.length === 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-xl px-3 font-bold border-gray-200 hover:bg-blue-50 hover:text-[#1F30AD] transition-all text-xs" 
                    onClick={() => handleEditUser(selectedRows[0])}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Modifier
                  </Button>
                )}
                {selectedRows.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="h-8 rounded-xl font-bold px-3 text-xs"
                    onClick={handleBulkDelete}
                    disabled={deleteModal.isLoading}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Supprimer ({selectedRows.length})
                  </Button>
                )}
              </div>
            }
            searchPlaceholder="Rechercher un utilisateur..."
            pageSizeOptions={[5, 10, 20, 50]}
            defaultPageSize={10}
            showSearch
            showFilters
            showPagination
            className="mt-4"
          />

        </CardContent>
      </Card>

      {/* Modals */}
      <UserFormModal
        isOpen={addModal.isOpen}
        onClose={addModal.closeModal}
        onSubmit={handleCreateUser}
        user={null}
        isLoading={addModal.isLoading}
        title="Ajouter un nouvel utilisateur"
        description="Remplissez le formulaire pour ajouter un nouvel utilisateur"
      />

      <UserFormModal
        isOpen={editModal.isOpen}
        onClose={editModal.closeModal}
        onSubmit={handleUpdateUser}
        user={selectedUser}
        isLoading={editModal.isLoading}
        title="Modifier l'utilisateur"
        description="Modifiez les informations de l'utilisateur"
      />

      <DeleteUserModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={handleConfirmDelete}
        user={selectedRows.length > 0 ? null : selectedUser}
        isLoading={deleteModal.isLoading}
        title={selectedRows.length > 0 ? `Supprimer ${selectedRows.length} utilisateurs` : undefined}
      />

    </div>
  );
}
