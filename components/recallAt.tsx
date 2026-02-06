"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Order } from "@/app/(dashboard)/list/orders/columns";
import { cn, formatSmartDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { isPast } from "date-fns";

export const RecallCell = ({
  order,
  onChange,
  readOnly,
  onInteractionStart,
  onInteractionEnd,
  pendingRecallAt,
}: {
  order: Order;
  onChange: (orderId: string, date: string | null) => void;
  readOnly?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  pendingRecallAt?: string | null;
}) => {
  const currentRecallAt = pendingRecallAt !== undefined ? pendingRecallAt : order.recallAt;
  const isPending = pendingRecallAt !== undefined;
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState<string>("");

  const startEditing = () => {
    if (readOnly) return;
    onInteractionStart?.();
    setTempValue(currentRecallAt?.slice(0, 16) ?? "");
    setOpen(true);
  };

  const commitChange = () => {
    // Only call onChange if the value actually changed
    // (Optional optimization, but good for reducing network calls)
    const current = currentRecallAt?.slice(0, 16) ?? "";
    if (tempValue !== current) {
       onChange(order.id, tempValue || null);
    }
    setOpen(false);
    onInteractionEnd?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitChange();
    } else if (e.key === 'Escape') {
      setOpen(false); // Cancel
      onInteractionEnd?.();
    }
  };

  if (open) {
    return (
      <Input
        type="datetime-local"
        value={tempValue}
        autoFocus
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={commitChange}
        onKeyDown={handleKeyDown}
        className="h-8 w-[180px]"
        disabled={readOnly}
      />
    );
  }

  return (
    <div
      onClick={startEditing}
      className={cn(
        "flex flex-col justify-center min-h-[32px] px-2 py-1 rounded transition-colors text-sm",
        !readOnly ? "hover:bg-muted cursor-pointer" : "opacity-50 cursor-not-allowed",
        !order.recallAt && "text-muted-foreground italic flex-row items-center gap-2"
      )}
    >
      {currentRecallAt ? (
        <div className={cn("flex flex-col gap-0.5", isPending && "opacity-70 italic")}>
          <span className={cn(
            "whitespace-nowrap text-[11px] leading-tight",
            isPast(new Date(currentRecallAt)) ? "text-red-600 font-bold" : "text-gray-700 font-medium",
            isPending && "text-yellow-600"
          )}>
            {formatSmartDate(currentRecallAt)}
          </span>
        </div>
      ) : (
        <>
           <Calendar className="h-3.5 w-3.5" /> 
           <span className="text-[11px]">Planifier</span>
        </>
      )}
    </div>
  );
};
