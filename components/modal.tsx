"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
  isLoading?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[95vw] max-h-[95vh]",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
  isLoading = false,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          "max-h-[85vh] overflow-y-auto",
          className
        )}
        onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
      >
        {(title || showCloseButton) && (
          <DialogHeader>
            <div className="flex items-center justify-between">
              {title && <DialogTitle>{title}</DialogTitle>}
              {showCloseButton && !isLoading && (
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mt-2 -mr-2"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Fermer</span>
                  </Button>
                </DialogClose>
              )}
            </div>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}

        <div className="py-4">{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

// Composant pour les boutons d'action du modal
interface ModalActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalActions({ children, className }: ModalActionsProps) {
  return (
    <div className={cn("flex items-center justify-end gap-3", className)}>
      {children}
    </div>
  );
}

// Composant pour la section de contenu du modal
interface ModalSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalSection({ children, className }: ModalSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  );
}

// Composant pour les boutons standard
interface ModalButtonProps {
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  type?: "button" | "submit" | "reset";
}

export function ModalButton({
  variant = "primary",
  onClick,
  children,
  disabled = false,
  isLoading = false,
  type = "button",
}: ModalButtonProps) {
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-600 text-white hover:bg-gray-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
    ghost: "bg-transparent hover:bg-gray-100",
  };

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(variantClasses[variant], "min-w-[100px]")}
    >
      {isLoading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          Chargement...
        </>
      ) : (
        children
      )}
    </Button>
  );
}