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


import { useTranslations, useLocale } from "next-intl";

const percent = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

/* Stats */
const getStatusStats = (statuses: Status[]) => ({
  total: statuses.length,
  withRecall: statuses.filter((s) => s.recallAfterH).length,
  withoutRecall: statuses.filter((s) => !s.recallAfterH).length,
});

export default function StatusPage() {
  const t = useTranslations("Status");
  const locale = useLocale();

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [selectedRows, setSelectedRows] = useState<Status[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const StatCard = ({ title, value, icon: Icon, active, onClick, color, trend, trendUp, isClickable = true, bgColor, description }: any) => {
    return (
      <Card
        onClick={() => isClickable && onClick?.()}
        style={{ backgroundColor: bgColor }}
        className={cn(
          "relative p-2 sm:p-3 border border-gray-100 shadow-xs rounded-xl overflow-hidden flex flex-col justify-between h-full",
          isClickable ? "cursor-pointer transition-all duration-300 hover:shadow-md hover:border-blue-200 group" : "cursor-default",
          active ? "ring-2 ring-[#1F30AD] ring-offset-2" : ""
        )}
      >
      <div className="flex justify-between items-start mb-1 sm:mb-1">
        <div className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl group-hover:bg-black/5 transition-colors", color)}>
          {Icon && <Icon className="h-4 w-4 sm:h-4 sm:w-4" />}
        </div>
      </div>
      <div>
        <p className="text-[10px] sm:text-[10px] font-black text-gray-900 uppercase tracking-widest mb-0.5 sm:mb-1">{title}</p>
        <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-tight">{value}</h3>
        {description && <div className="mt-1 text-xs text-muted-foreground">{description}</div>}
      </div>
    </Card>
  ); };


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
      toast.error(t('messages.loadError'));
    } finally {
      setIsLoadingPage(false);
    }
  }, [t]);

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
      toast.success(t('messages.createSuccess'));
    } catch (e: any) {
      toast.error(e.message || t('messages.createError'));
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
      toast.success(t('messages.updateSuccess'));
    } catch (e: any) {
      toast.error(e.message || t('messages.updateError'));
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
        const count = selectedRows.length;
        setSelectedRows([]);
        toast.success(t('messages.bulkDeleteSuccess', { count }));
      } catch (error: any) {
        toast.error(error.message || t('messages.bulkDeleteError'));
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
      toast.success(t('messages.deleteSuccess'));
    } catch (e: any) {
      toast.error(e.message || t('messages.deleteError'));
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
    () => getColumns(t),
    [t]
  );

  if (hasPermission === false) return <PermissionDenied />;
  if (hasPermission === null) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">

      {/* Statistiques */}
      {statuses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard
            title={t('stats.total')}
            value={stats.total.toLocaleString("fr-FR")}
            icon={ListChecks}
            color="bg-blue-500/10 text-blue-600"
            bgColor="#e3f0ff"
          />

          <StatCard
            title={t('stats.withRecall')}
            value={stats.withRecall.toLocaleString("fr-FR")}
            icon={BellRing}
            color="bg-amber-500/10 text-amber-600"
            bgColor="#fff4e3"
            description={
              <div className="text-[10px] font-bold text-amber-600">
                {t('stats.percentOfTotal', { percent: percent(stats.withRecall, stats.total).toLocaleString("fr-FR") })}
              </div>
            }
          />

          <StatCard
            title={t('stats.standard')}
            value={stats.withoutRecall.toLocaleString("fr-FR")}
            icon={Clock}
            color="bg-gray-500/10 text-gray-600"
            bgColor="#f8f9fa"
            description={
              <div className="text-[10px] font-bold text-gray-600">
                {t('stats.percentOfTotal', { percent: percent(stats.withoutRecall, stats.total).toLocaleString("fr-FR") })}
              </div>
            }
          />
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('table.title')}</CardTitle>
          <CardDescription>
            {t('table.summary', { total: stats.total, withRecall: stats.withRecall })}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <DataTable<Status, unknown>
            columns={columns}
            data={statuses}
            onSelectionChange={setSelectedRows}
            extraSearchActions={
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedRows.length === 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-lg px-2 sm:px-3 font-bold border-gray-200 hover:bg-blue-50 hover:text-[#1F30AD] transition-all text-[10px]" 
                    onClick={() => handleEdit(selectedRows[0])}
                  >
                    <Edit className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">{t('form.editBtn')}</span>
                  </Button>
                )}
                {selectedRows.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="h-8 rounded-lg font-bold px-2 sm:px-3 text-[10px]"
                    onClick={handleBulkDelete}
                    disabled={deleteModal.isLoading}
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">{t('modal.deleteBtn')} ({selectedRows.length})</span>
                    <span className="sm:hidden">{selectedRows.length}</span>
                  </Button>
                )}
              </div>
            }
            searchPlaceholder={t('table.searchPlaceholder')}
            pageSizeOptions={[10, 20, 50]}
            defaultPageSize={50}
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
        itemName={selectedRows.length > 0 ? t('messages.bulkDeleteSuccess', { count: selectedRows.length }).replace('!', '') : selectedStatus?.name}
        isLoading={deleteModal.isLoading}
        count={selectedRows.length}
      />
    </div>
  );
}
