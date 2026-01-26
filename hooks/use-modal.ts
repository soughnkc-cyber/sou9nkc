"use client";

import { useState, useCallback } from "react";

interface UseModalOptions {
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useModal(options: UseModalOptions = {}) {
  const { defaultOpen = false, onOpen, onClose } = options;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isLoading, setIsLoading] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const closeModal = useCallback(() => {
    if (!isLoading) {
      setIsOpen(false);
      onClose?.();
    }
  }, [isLoading, onClose]);

  const toggleModal = useCallback(() => {
    if (isOpen) {
      closeModal();
    } else {
      openModal();
    }
  }, [isOpen, openModal, closeModal]);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    isOpen,
    isLoading,
    openModal,
    closeModal,
    toggleModal,
    setLoading,
  };
}