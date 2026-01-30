"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { DataTable } from "@/components/datatable";
import { getColumns, Status } from "./columns";
import { StatusFormData } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useModal } from "@/hooks/use-modal";
import { toast } from "sonner";

/* Actions Status */
import {
  getStatus,
  createStatusAction,
  updateStatusAction,
  deleteStatusAction,
  deleteStatusesAction,
} from "@/lib/actions/status";

/* Modals */
import { StatusFormModal } from "@/components/forms/status-form-modal";
import { DeleteStatusModal } from "@/components/delete-modal";
import { getMe } from "@/lib/actions/users";
import PermissionDenied from "@/components/permission-denied";


const percent = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

const getStatusStats = (statuses: Status[]) => ({
  total: statuses.length,
  withRecall: statuses.filter((s) => s.recallAfterH).length,
  withoutRecall: statuses.filter((s) => !s.recallAfterH).length,
});

export default function StatusPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [selectedRows, setSelectedRows] = useState<Status[]>([]);
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
  const handleCreate = async (data: StatusFormData) => {
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

  const handleUpdate = async (data: Partial<StatusFormData>) => {
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
    if (selectedRows.length > 0) {
      // Suppression groupée
      try {
        deleteModal.setLoading(true);
        await deleteStatusesAction(selectedRows.map(s => s.id));
        setStatuses(prev => prev.filter(s => !selectedRows.find(sr => sr.id === s.id)));
        deleteModal.closeModal();
        setSelectedRows([]);
        toast.success(`${selectedRows.length} statuts supprimés avec succès !`);
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la suppression des statuts");
      } finally {
        deleteModal.setLoading(false);
      }
      return;
    }

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

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    deleteModal.openModal();
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

      {/* Statistiques */}
      {statuses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <Card className="p-3">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-gray-500">Total statuts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex justify-between items-center text-base font-medium">
                <span>Total</span>
                <span className="text-lg font-bold">{stats.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="p-3">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-gray-500">Avec rappel</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex justify-between items-center text-base font-medium">
                <span>Rappel activé</span>
                <span className="text-lg font-bold text-blue-600">{stats.withRecall}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>% du total</span>
                <span>{percent(stats.withRecall, stats.total)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="p-3">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-gray-500">Sans rappel</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex justify-between items-center text-base font-medium">
                <span>Standard</span>
                <span className="text-lg font-bold text-gray-600">{stats.withoutRecall}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>% du total</span>
                <span>{percent(stats.withoutRecall, stats.total)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
            onSelectionChange={setSelectedRows}
            extraSearchActions={
              selectedRows.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="h-8"
                  onClick={handleBulkDelete}
                  disabled={deleteModal.isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer ({selectedRows.length})
                </Button>
              )
            }
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
        itemName={selectedRows.length > 0 ? `${selectedRows.length} statuts` : selectedStatus?.name}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
