// app/admin/users/components/user-form-modal.tsx
"use client";

import { User } from "@/app/[locale]/(dashboard)/list/users/columns";
import { UserFormData } from "@/lib/schema";
import { Modal } from "../modal";
import { UserForm } from "./userForm";
import { useTranslations } from "next-intl";


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
  const t = useTranslations("Users.modal");
  const isEditMode = !!user;

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