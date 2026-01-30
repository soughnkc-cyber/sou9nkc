"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { DataTable } from "@/components/datatable";
import { getColumns, Status } from "./columns";
import { StatusFormData } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { ListChecks, BellRing, Clock, Edit } from "lucide-react";


const percent = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

/* Stats */
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
    () => getColumns(),
    []
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
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">Statuts</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Gestion des statuts et rappels clients</p>
        </div> */}

        <div className="flex items-center justify-center w-full md:w-auto gap-2 sm:gap-3">
            <Button 
                variant="outline" 
                size="sm" 
                className="h-10 rounded-xl px-3 sm:px-4 font-bold border-gray-200 hover:bg-gray-50 shrink-0" 
                onClick={handleRefresh} 
                disabled={isLoadingPage}
            >
              <RefreshCw className={cn("h-4 w-4 sm:mr-2", isLoadingPage && "animate-spin")} />
              <span className="hidden sm:inline">Rafraîchir</span>
            </Button>


        </div>
      </div>

      {/* Statistiques */}
      {statuses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
          <StatCard
            title="Total Statuts"
            value={stats.total}
            icon={ListChecks}
            color="bg-blue-50"
          />

          <StatCard
            title="Avec Rappel"
            value={stats.withRecall}
            icon={BellRing}
            color="bg-blue-50"
            description={
              <div className="text-[10px] font-bold text-[#1F30AD]">
                {percent(stats.withRecall, stats.total)}% du total
              </div>
            }
          />

          <StatCard
            title="Standard"
            value={stats.withoutRecall}
            icon={Clock}
            color="bg-gray-50"
            description={
              <div className="text-[10px] font-bold text-gray-600">
                {percent(stats.withoutRecall, stats.total)}% du total
              </div>
            }
          />
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
              <div className="flex items-center gap-2">
                {selectedRows.length === 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-xl px-3 font-bold border-gray-200 hover:bg-blue-50 hover:text-[#1F30AD] transition-all text-xs" 
                    onClick={() => handleEdit(selectedRows[0])}
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
