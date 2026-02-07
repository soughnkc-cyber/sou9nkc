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
import { useTranslations } from "next-intl";

export function BulkEditModal({
  isOpen,
  onClose,
  selectedCount,
  agents,
  statuses,
  onUpdate,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  agents: { id: string; name: string; isActive: boolean }[];
  statuses: { id: string; name: string; color?: string; isActive?: boolean }[];
  onUpdate: (updates: { agentId?: string; statusId?: string | null; recallAt?: string | null }) => Promise<void>;
  isLoading?: boolean;
}) {
  const t = useTranslations('Orders.bulkEditModal');
  const [selectedAgentId, setSelectedAgentId] = useState<string>("no_change");
  const [selectedStatusId, setSelectedStatusId] = useState<string>("no_change");
  const [selectedRecallAt, setSelectedRecallAt] = useState<string>("no_change");
  const [manualDate, setManualDate] = useState<string>("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
        setSelectedAgentId("no_change");
        setSelectedStatusId("no_change");
        setSelectedRecallAt("no_change");
        setManualDate("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const updates: any = {};
    if (selectedAgentId !== "no_change") updates.agentId = selectedAgentId;
    if (selectedStatusId !== "no_change") updates.statusId = selectedStatusId === "clear" ? null : selectedStatusId;
    if (selectedRecallAt !== "no_change") {
        updates.recallAt = selectedRecallAt === "manual" ? (manualDate || null) : null;
    }
    
    if (Object.keys(updates).length > 0) {
        await onUpdate(updates);
    }
    onClose();
  };

  const hasChanges = selectedAgentId !== "no_change" || selectedStatusId !== "no_change" || selectedRecallAt !== "no_change";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title', { count: selectedCount })}
      description={t('description')}
      size="sm"
      showCloseButton={true}
      closeOnOverlayClick={!isLoading}
      isLoading={isLoading}
    >
      <div className="space-y-6 py-2">
        
        {/* Champs de Sélection */}
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>{t('agentLabel')}</Label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                    <SelectTrigger className="h-9">
                        <SelectValue placeholder={t('agentPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="no_change" className="text-gray-500 italic">{t('noChange')}</SelectItem>
                        <SelectItem value="unassigned" className="text-amber-600 font-medium">{t('unassigned')}</SelectItem>
                        {agents
                            .filter(a => a.isActive)
                            .map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
                {t('cancel')}
            </Button>
            <Button 
                onClick={handleSubmit} 
                disabled={isLoading || !hasChanges}
                className="bg-[#1F30AD] hover:bg-[#1F30AD]/90 text-white"
            >
                {isLoading ? t('processing') : t('apply')}
            </Button>
        </div>

      </div>
    </Modal>
  );
}
