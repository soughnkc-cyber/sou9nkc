"use client";

import { Modal } from "../modal";
import { AgentAssignmentForm, AgentAssignmentData } from "./agent-assignment-form";
import { useTranslations } from "next-intl";

interface AgentAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AgentAssignmentData) => Promise<void>;
  agents: { id: string; name: string; isActive: boolean }[];
  currentAgentId?: string | null;
  isLoading?: boolean;
  orderNumber?: number;
}

export function AgentAssignmentModal({
  isOpen,
  onClose,
  onSubmit,
  agents,
  currentAgentId,
  isLoading = false,
  orderNumber,
}: AgentAssignmentModalProps) {
  const t = useTranslations('Orders.assignModal');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title', { orderNumber: orderNumber || "" })}
      description={t('description')}
      size="md"
      showCloseButton={true}
      closeOnOverlayClick={!isLoading}
      isLoading={isLoading}
    >
      <AgentAssignmentForm
        agents={agents}
        currentAgentId={currentAgentId}
        onSubmit={onSubmit}
        isLoading={isLoading}
      />
    </Modal>
  );
}
