// app/admin/users/components/user-form-modal.tsx
"use client";

import { StatusFormData } from "@/lib/schema";
import { Modal } from "../modal";
import { StatusForm } from "./statusForm";
import { Status } from "@/app/(dashboard)/list/status/columns";


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
  const isEditMode = !!status;

  return (
   <Modal
  isOpen={isOpen}
  onClose={onClose}
  title={title || (isEditMode ? "Modifier l'utilisateur" : "Créer un nouvel utilisateur")}
  description={description || (isEditMode ? "Modifiez les informations..." : "Remplissez le formulaire...")}
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