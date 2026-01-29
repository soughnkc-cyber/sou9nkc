"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { DataTable } from "@/components/datatable";
import { getColumns, Status } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useModal } from "@/hooks/use-modal";
import { toast } from "sonner";

/* Actions Status (à créer comme users) */
import {
  getStatus,
  createStatusAction,
  updateStatusAction,
  deleteStatusAction,
} from "@/lib/actions/status";

/* Modals */
import { StatusFormModal } from "@/components/forms/status-form-modal";
import { DeleteStatusModal } from "@/components/delete-modal";
import { getMe } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";



const getStatusStats = (statuses: Status[]) => ({
  total: statuses.length,
  withRecall: statuses.filter((s) => s.recallAfterH).length,
  withoutRecall: statuses.filter((s) => !s.recallAfterH).length,
});

export default function StatusPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);


  /* Modals */
  const addModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();

  /* Fetch */
  const fetchStatuses = useCallback(async () => {
    setIsLoadingPage(true);
    try {
      const data = await getStatus();
      setStatuses(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des statuts");
    } finally {
      setIsLoadingPage(false);
    }
  }, []);

  useEffect(() => {
    getMe().then(user => {
      if (user?.canViewStatuses) {
        setHasPermission(true);
        fetchStatuses();
      } else {
        setHasPermission(false);
      }
    });
  }, [fetchStatuses]);


  /* Handlers */
  const handleAdd = () => {
    setSelectedStatus(null);
    addModal.openModal();
  };

  const handleEdit = (status: Status) => {
    setSelectedStatus(status);
    editModal.openModal();
  };

  const handleDelete = (status: Status) => {
    setSelectedStatus(status);
    deleteModal.openModal();
  };

  const handleRefresh = () => fetchStatuses();

  /* CRUD */
  const handleCreate = async (data: { name: string; recallAfterH?: number }) => {
    try {
      addModal.setLoading(true);
      const created = await createStatusAction(data);
      setStatuses((prev) => [created, ...prev]);
      addModal.closeModal();
      toast.success("Statut créé avec succès");
    } catch (e: any) {
      toast.error(e.message || "Erreur création statut");
    } finally {
      addModal.setLoading(false);
    }
  };

  const handleUpdate = async (data: { name: string; recallAfterH?: number }) => {
    if (!selectedStatus) return;
    try {
      editModal.setLoading(true);
      const updated = await updateStatusAction(selectedStatus.id, data);
      setStatuses((prev) =>
        prev.map((s) => (s.id === selectedStatus.id ? updated : s))
      );
      editModal.closeModal();
      toast.success("Statut modifié");
    } catch (e: any) {
      toast.error(e.message || "Erreur modification statut");
    } finally {
      editModal.setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedStatus) return;
    try {
      deleteModal.setLoading(true);
      await deleteStatusAction(selectedStatus.id);
      setStatuses((prev) => prev.filter((s) => s.id !== selectedStatus.id));
      deleteModal.closeModal();
      toast.success("Statut supprimé");
    } catch (e: any) {
      toast.error(e.message || "Erreur suppression statut");
    } finally {
      deleteModal.setLoading(false);
    }
  };

  /* Memo */
  const stats = useMemo(() => getStatusStats(statuses), [statuses]);
  const columns = useMemo(
    () => getColumns(undefined, handleEdit, handleDelete),
    []
  );

  if (hasPermission === false) return <PermissionDenied />;
  if (hasPermission === null) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Statuts</h1>
          <p className="text-gray-500 mt-1">
            Gestion des statuts et rappels clients
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingPage}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoadingPage ? "animate-spin" : ""}`}
            />
            Rafraîchir
          </Button>

          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des statuts</CardTitle>
          <CardDescription>
            {stats.total} statuts •{" "}
            <span className="text-blue-600">{stats.withRecall} avec rappel</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <DataTable<Status, unknown>
            columns={columns}
            data={statuses}
            searchPlaceholder="Rechercher un statut..."
            pageSizeOptions={[5, 10, 20]}
            defaultPageSize={10}
            showSearch
            showPagination
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <StatusFormModal
        isOpen={addModal.isOpen}
        onClose={addModal.closeModal}
        onSubmit={handleCreate}
        status={null}
        isLoading={addModal.isLoading}
      />

      <StatusFormModal
        isOpen={editModal.isOpen}
        onClose={editModal.closeModal}
        onSubmit={handleUpdate}
        status={selectedStatus}
        isLoading={editModal.isLoading}
      />

      <DeleteStatusModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={handleConfirmDelete}
        itemName={selectedStatus?.name}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
