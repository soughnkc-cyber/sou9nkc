// components/ui/modal/confirm-modal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "success" | "info";
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: XCircle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    confirmButtonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    confirmButtonClass: "bg-green-600 hover:bg-green-700 text-white",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    confirmButtonClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  const { icon: Icon, iconColor, bgColor, confirmButtonClass } = variantConfig[variant];

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={isLoading ? undefined : onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            {!isLoading && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-2 -mr-2"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fermer</span>
              </Button>
            )}
          </div>
          <DialogDescription className="sr-only">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className={cn("p-4 rounded-lg flex items-start gap-3", bgColor)}>
            <Icon className={cn("h-6 w-6 mt-0.5 flex-shrink-0", iconColor)} />
            <p className="text-sm text-gray-700">{message}</p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn("min-w-[100px]", confirmButtonClass)}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Chargement...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}