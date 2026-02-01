"use client";

import { Modal } from "../modal";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";



export function BulkEditModal({
  isOpen,
  onClose,
  selectedCount,
  agents,
  onUpdate,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  agents: { id: string; name: string }[];
  onUpdate: (agentId: string) => Promise<void>;
  isLoading?: boolean;
}) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("no_change");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
        setSelectedAgentId("no_change");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (selectedAgentId !== "no_change") {
        await onUpdate(selectedAgentId);
    }
    onClose();
  };

  const hasChanges = selectedAgentId !== "no_change";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifier ${selectedCount} commandes`}
      description="Assigner un nouvel agent aux commandes sélectionnées."
      size="sm"
      showCloseButton={true}
      closeOnOverlayClick={!isLoading}
      isLoading={isLoading}
    >
      <div className="space-y-6 py-2">
        
        {/* Champs de Sélection */}
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Agent</Label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un agent..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="no_change" className="text-gray-500 italic">-- Sélectionner --</SelectItem>
                        <SelectItem value="unassigned" className="text-amber-600 font-medium">Désassigner (Pas d'agent)</SelectItem>
                        {agents.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Annuler
            </Button>
            <Button 
                onClick={handleSubmit} 
                disabled={isLoading || !hasChanges}
                className="bg-[#1F30AD] hover:bg-[#1F30AD]/90"
            >
                {isLoading ? "Traitement..." : "Appliquer"}
            </Button>
        </div>

      </div>
    </Modal>
  );
}
