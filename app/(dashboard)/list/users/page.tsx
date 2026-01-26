// app/admin/users/page.tsx
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { DataTable } from "@/components/datatable";
import { getColumns, User } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useModal } from "@/hooks/use-modal";
import { UserFormData } from "@/lib/schema";
import { UserFormModal } from "@/components/forms/user-form-modal";
import { DeleteUserModal } from "@/components/delete-modal";
import { toast } from "sonner";
import { getUsers, createUserAction, updateUserAction, deleteUserAction } from "@/lib/actions/users";

const percent = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

const getUserStats = (users: User[]) => ({
  total: users.length,
  active: users.filter((u) => u.status === "ONLINE").length,
  inactive: users.filter((u) => u.status === "OFFLINE").length,
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
  const [isLoadingPage, setIsLoadingPage] = useState(false);

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
    fetchUsers();
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
  }, [selectedUser, deleteModal]);

  const stats = useMemo(() => getUserStats(users), [users]);
  const columns = useMemo(() => getColumns(undefined, handleEditUser, handleDeleteUser), [
    handleEditUser,
    handleDeleteUser,
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* Header avec boutons */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">Gestion des utilisateurs et permissions</p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isLoadingPage || addModal.isLoading || editModal.isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPage ? "animate-spin" : ""}`} />
            Rafraîchir
          </Button>

          <Button 
            size="sm" 
            onClick={handleAddUser} 
            className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
            disabled={addModal.isLoading || editModal.isLoading || deleteModal.isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

{/* Statistiques */}
{users.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
    <Card className="p-3">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-gray-500">Total utilisateurs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex justify-between items-center text-base font-medium">
          <span>Total</span>
          <span className="text-lg font-bold">{stats.total}</span>
        </div>
        <div className="flex flex-wrap gap-1 text-xs mt-1">
          <span className="px-2 py-0.5 bg-gray-100 rounded">{stats.byRole.ADMIN} Admin</span>
          <span className="px-2 py-0.5 bg-gray-100 rounded">{stats.byRole.AGENT} Agent</span>
          <span className="px-2 py-0.5 bg-gray-100 rounded">{stats.byRole.SUPERVISOR} Superviseur</span>
        </div>
      </CardContent>
    </Card>

    <Card className="p-3">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-gray-500">Utilisateurs actifs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex justify-between items-center text-base font-medium">
          <span>Actifs</span>
          <span className="text-lg font-bold text-green-600">{stats.active}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>% du total</span>
          <span>{percent(stats.active, stats.total)}%</span>
        </div>
      </CardContent>
    </Card>

    <Card className="p-3">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-gray-500">Utilisateurs inactifs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex justify-between items-center text-base font-medium">
          <span>Inactifs</span>
          <span className="text-lg font-bold text-red-600">{stats.inactive}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>% du total</span>
          <span>{percent(stats.inactive, stats.total)}%</span>
        </div>
      </CardContent>
    </Card>
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
        user={selectedUser}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
