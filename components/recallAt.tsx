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
        "flex flex-col justify-center min-h-[32px] px-2 py-1 rounded transition-colors text-sm",
        !readOnly ? "hover:bg-muted cursor-pointer" : "opacity-50 cursor-not-allowed",
        !order.recallAt && "text-muted-foreground italic flex-row items-center gap-2"
      )}
    >
      {order.recallAt ? (
        <div className="flex flex-col gap-0.5">
          {isPast(new Date(order.recallAt)) && (
            <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 w-fit leading-none font-bold uppercase tracking-tighter">
              À rappeler
            </Badge>
          )}
          <span className={cn(
            "whitespace-nowrap text-[11px] leading-tight",
            isPast(new Date(order.recallAt)) ? "text-red-600 font-bold" : "text-gray-700 font-medium"
          )}>
            {formatSmartDate(order.recallAt)}
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
