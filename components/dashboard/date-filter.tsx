"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateFilterType = "today" | "week" | "month" | "custom";

interface DateFilterProps {
  value: DateFilterType;
  onChange: (type: DateFilterType, customRange?: { start: string; end: string }) => void;
}

const filterOptions = [
  { value: "today" as const, label: "Aujourd'hui" },
  { value: "week" as const, label: "Cette semaine" },
  { value: "month" as const, label: "Ce mois" },
  { value: "custom" as const, label: "Période personnalisée" },
];

export function DateFilter({ value, onChange }: DateFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const currentLabel = filterOptions.find(opt => opt.value === value)?.label || "Ce mois";

  const handleSelect = (newValue: DateFilterType) => {
    if (newValue === "custom") {
      setShowCustom(true);
    } else {
      onChange(newValue);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange("custom", { start: customStart, end: customEnd });
      setShowCustom(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          {currentLabel}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Période</h4>
          <div className="grid gap-2">
            {filterOptions.map(option => (
              <Button
                key={option.value}
                variant={value === option.value ? "default" : "ghost"}
                className="justify-start"
                size="sm"
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {showCustom && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <label className="text-xs text-muted-foreground">Début</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fin</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <Button
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
                size="sm"
                className="w-full"
              >
                Appliquer
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
