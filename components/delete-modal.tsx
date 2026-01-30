// app/admin/users/components/delete-user-modal.tsx
"use client";


import { User } from "@/app/(dashboard)/list/users/columns";
import { ConfirmModal } from "./confirm-modal";
import { Status } from "@/app/(dashboard)/list/status/columns";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user: User | null;
  isLoading?: boolean;
  title?: string;
}

interface DeleteStatusModalProps {
  isOpen: boolean;  
  onClose: () => void;
  onConfirm: () => Promise<void>;
  status?: Status | null;
  itemName?: string;
  isLoading?: boolean;
}

export function DeleteUserModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  isLoading = false,
  title,
}: DeleteUserModalProps) {
  if (!user && !title) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title || "Supprimer l'utilisateur"}
      message={user 
        ? `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ? Cette action est irréversible.`
        : "Êtes-vous sûr de vouloir supprimer les utilisateurs sélectionnés ? Cette action est irréversible."
      }
      confirmText="Supprimer"
      cancelText="Annuler"
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
}: DeleteStatusModalProps) {
  const name = status?.name || itemName;
  
  if (!name && !status) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Supprimer le statut"
      message={`Êtes-vous sûr de vouloir supprimer le statut "${name}" ? Cette action est irréversible.`}
      confirmText="Supprimer"
      cancelText="Annuler"
      variant="danger"
      isLoading={isLoading}
    />
  );
}