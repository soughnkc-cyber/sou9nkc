"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({ range, onChange, className }: DateRangePickerProps) {
  const presets = [
    { label: "Aujourd'hui", range: { from: startOfDay(new Date()), to: endOfDay(new Date()) } },
    { label: "Hier", range: { from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) } },
    { label: "7 derniers jours", range: { from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) } },
    { label: "30 derniers jours", range: { from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) } },
    { label: "Ce mois", range: { from: startOfMonth(new Date()), to: endOfDay(new Date()) } },
    { label: "Mois dernier", range: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfDay(subDays(startOfMonth(new Date()), 1)) } },
  ];

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal bg-white border-blue-200 text-blue-900 shadow-sm",
              !range && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
            {range?.from ? (
              range.to ? (
                <>
                  {format(range.from, "dd MMM", { locale: fr })} -{" "}
                  {format(range.to, "dd MMM yyyy", { locale: fr })}
                </>
              ) : (
                format(range.from, "dd MMM yyyy", { locale: fr })
              )
            ) : (
              <span>Choisir une période</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 flex flex-row gap-4" align="start">
          <div className="flex flex-col gap-2 border-r pr-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Raccourcis</span>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="justify-start font-medium text-xs hover:bg-blue-50 hover:text-blue-700"
                onClick={() => onChange(preset.range)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Personnalisé</span>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500">Du</label>
                <Input
                  type="date"
                  value={range.from ? format(range.from, "yyyy-MM-dd") : ""}
                  onChange={(e) => onChange({ ...range, from: e.target.value ? new Date(e.target.value) : undefined })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-gray-500">Au</label>
                <Input
                  type="date"
                  value={range.to ? format(range.to, "yyyy-MM-dd") : ""}
                  onChange={(e) => onChange({ ...range, to: e.target.value ? new Date(e.target.value) : undefined })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <Button 
                size="sm" 
                className="mt-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                    if (range.from && !range.to) onChange({...range, to: range.from});
                }}
            >
                Appliquer
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
