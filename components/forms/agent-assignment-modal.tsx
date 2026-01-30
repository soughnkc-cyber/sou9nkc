"use client";

import { Modal } from "../modal";
import { AgentAssignmentForm, AgentAssignmentData } from "./agent-assignment-form";

interface AgentAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AgentAssignmentData) => Promise<void>;
  agents: { id: string; name: string }[];
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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assigner la commande #${orderNumber || ""}`}
      description="Sélectionnez l'agent qui sera responsable de cette commande."
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
