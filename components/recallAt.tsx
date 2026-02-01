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
}: {
  order: Order;
  onChange: (orderId: string, date: string | null) => void;
  readOnly?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState<string>("");

  const startEditing = () => {
    if (readOnly) return;
    onInteractionStart?.();
    setTempValue(order.recallAt?.slice(0, 16) ?? "");
    setOpen(true);
  };

  const commitChange = () => {
    // Only call onChange if the value actually changed
    // (Optional optimization, but good for reducing network calls)
    const current = order.recallAt?.slice(0, 16) ?? "";
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
        "flex items-center h-8 px-2 rounded transition-colors text-sm",
        !readOnly ? "hover:bg-muted cursor-pointer" : "opacity-50 cursor-not-allowed",
        !order.recallAt && "text-muted-foreground italic"
      )}
    >
      {order.recallAt ? (
        <span className={cn("whitespace-nowrap")}>
          {isPast(new Date(order.recallAt)) ? (
            <Badge variant="destructive" className="text-[10px] px-1 py-0 h-5">À rappeler</Badge>
          ) : (
            formatSmartDate(order.recallAt)
          )}
        </span>
      ) : (
        <span className="flex items-center gap-2">
           <Calendar className="h-4 w-4" /> 
           <span className="text-xs">Ajouter</span>
        </span>
      )}
    </div>
  );
};
