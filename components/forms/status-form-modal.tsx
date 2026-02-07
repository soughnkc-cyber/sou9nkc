// app/admin/users/components/user-form-modal.tsx
"use client";

import { StatusFormData } from "@/lib/schema";
import { Modal } from "../modal";
import { StatusForm } from "./statusForm";
import { Status } from "@/app/[locale]/(dashboard)/list/status/columns";
import { useTranslations } from "next-intl";


interface StatusFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StatusFormData) => Promise<void>;
  status?: Status | null;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function StatusFormModal({
  isOpen,
  onClose,
  onSubmit,
  status,
  isLoading = false,
  title,
  description,
}: StatusFormModalProps) {
  const t = useTranslations("Status.modal");
  const isEditMode = !!status;

  return (
   <Modal
  isOpen={isOpen}
  onClose={onClose}
  title={title || (isEditMode ? t('editTitle') : t('createTitle'))}
  description={description || (isEditMode ? t('editDesc') : t('createDesc'))}
  size="lg"
  showCloseButton={false}
  closeOnOverlayClick={!isLoading}
  isLoading={isLoading}
  className="max-h-[90vh] overflow-y-auto"
>
  <StatusForm
    status={status}
    onSubmit={onSubmit}
    isLoading={isLoading}
    isEditMode={isEditMode}
  />
</Modal>

  );
}