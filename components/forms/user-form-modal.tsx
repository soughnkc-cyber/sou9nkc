// app/admin/users/components/user-form-modal.tsx
"use client";

import { User } from "@/app/(dashboard)/list/users/columns";
import { UserFormData } from "@/lib/schema";
import { Modal } from "../modal";
import { UserForm } from "./userForm";


interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  user?: User | null;
  isLoading?: boolean;
  title?: string;
  description?: string;
  isSelfEdit?: boolean;
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  isLoading = false,
  title,
  description,
  isSelfEdit = false,
}: UserFormModalProps) {
  const isEditMode = !!user;

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
  <UserForm
    user={user}
    onSubmit={onSubmit}
    isLoading={isLoading}
    isEditMode={isEditMode}
    isSelfEdit={isSelfEdit}
  />
</Modal>

  );
}