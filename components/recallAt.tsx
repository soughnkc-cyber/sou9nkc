"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Order } from "@/app/(dashboard)/list/orders/columns";
import { cn } from "@/lib/utils";

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

  // 🔹 Si date existe → input direct
  if (order.recallAt || open) {
    return (
      <Input
        type="datetime-local"
        value={order.recallAt?.slice(0, 16) ?? ""}
        onChange={(e) =>
          onChange(order.id, e.target.value || null)
        }
        onBlur={() => setOpen(false)}
        className="h-8"
        disabled={readOnly}
      />
    );
  }

  // 🔹 Sinon → icône calendrier cliquable
  return (
    <button
      type="button"
      onClick={() => !readOnly && setOpen(true)}
      className={cn(
        "flex items-center justify-center h-8 w-8 rounded transition-colors",
        !readOnly ? "hover:bg-muted cursor-pointer" : "opacity-50 cursor-not-allowed"
      )}
    >
      <Calendar className="h-4 w-4 text-muted-foreground" />
    </button>
  );
};
