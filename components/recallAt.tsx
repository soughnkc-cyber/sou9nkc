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
}: {
  order: Order;
  onChange: (orderId: string, date: string | null) => void;
  readOnly?: boolean;
}) => {
  const [open, setOpen] = useState(false);

  // 🔹 Si open ou (pas de date et pas readOnly) -> input
  // Mais si date existe, on affiche le texte formatted, et au clic on ouvre
  if (open) {
    return (
      <Input
        type="datetime-local"
        value={order.recallAt?.slice(0, 16) ?? ""}
        autoFocus
        onChange={(e) =>
          onChange(order.id, e.target.value || null)
        }
        onBlur={() => setOpen(false)}
        className="h-8 w-[180px]"
        disabled={readOnly}
      />
    );
  }

  return (
    <div
      onClick={() => !readOnly && setOpen(true)}
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
