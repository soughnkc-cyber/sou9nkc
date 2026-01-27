"use client";

import { Calendar } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Order } from "@/app/(dashboard)/list/orders/columns";

export const RecallCell = ({
  order,
  onChange,
}: {
  order: Order;
  onChange: (orderId: string, date: string | null) => void;
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
      />
    );
  }

  // 🔹 Sinon → icône calendrier cliquable
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center justify-center h-8 w-8 rounded hover:bg-muted"
    >
      <Calendar className="h-4 w-4 text-muted-foreground" />
    </button>
  );
};
