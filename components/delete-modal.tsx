// app/admin/users/components/delete-user-modal.tsx
"use client";


import { User } from "@/app/[locale]/(dashboard)/list/users/columns";
import { ConfirmModal } from "./confirm-modal";
import { Status } from "@/app/[locale]/(dashboard)/list/status/columns";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user: User | null;
  isLoading?: boolean;
  title?: string;
}

import { useTranslations } from "next-intl";

interface DeleteStatusModalProps {
  isOpen: boolean;  
  onClose: () => void;
  onConfirm: () => Promise<void>;
  status?: Status | null;
  itemName?: string;
  isLoading?: boolean;
  count?: number;
}

export function DeleteUserModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  isLoading = false,
  title,
}: DeleteUserModalProps) {
  const t = useTranslations("Users.modal");
  if (!user && !title) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title || t('deleteUser') || "Supprimer l'utilisateur"}
      message={user 
        ? t('confirmDelete', { name: user.name })
        : t('confirmBulkDelete')
      }
      confirmText={t('deleteBtn', { defaultValue: "Supprimer" })}
      cancelText={t('cancelBtn', { defaultValue: "Annuler" })}
      variant="danger"
      isLoading={isLoading}
    />
  );
}

export function DeleteStatusModal({
  isOpen,
  onClose,
  onConfirm,
  status,
  itemName,
  isLoading = false,
  count = 0,
}: DeleteStatusModalProps) {
  const t = useTranslations("Status.modal");
  const name = status?.name || itemName || "";
  
  if (!name && !status) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('deleteTitle')}
      message={count > 0 
        ? t('confirmBulkDeleteMsg', { count }) 
        : t('confirmDeleteMsg', { name })}
      confirmText={t('deleteBtn')}
      cancelText={t('cancelBtn')}
      variant="danger"
      isLoading={isLoading}
    />
  );
}