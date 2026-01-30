"use client";

import React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Sélectionner...",
  className,
}: MultiSelectProps) {
  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((s) => s !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const removeOption = (value: string) => {
    onChange(selected.filter((s) => s !== value));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between min-h-8 h-auto font-normal bg-white border-blue-200 text-gray-900 shadow-sm px-2 py-1",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selected.length === 0 && (
              <span className="text-muted-foreground text-xs">{placeholder}</span>
            )}
            {selected.map((val) => {
              const option = options.find((o) => o.value === val);
              return (
                <Badge
                  key={val}
                  variant="secondary"
                  className="bg-blue-50 text-[#1F30AD] text-[10px] px-1 h-5 flex items-center gap-1 border-blue-100"
                >
                  {option?.label || val}
                  <X
                    className="h-2 w-2 cursor-pointer hover:text-blue-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(val);
                    }}
                  />
                </Badge>
              );
            })}
          </div>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="max-h-64 overflow-y-auto p-1">
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "flex items-center justify-between px-2 py-1.5 text-xs rounded-sm cursor-pointer hover:bg-blue-50 transition-colors",
                selected.includes(option.value) && "bg-blue-100 font-bold text-blue-900"
              )}
              onClick={() => toggleOption(option.value)}
            >
              <div className="flex items-center gap-2">
                <Check
                  className={cn(
                    "h-3 w-3",
                    selected.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </div>
            </div>
          ))}
          {options.length === 0 && (
            <div className="p-2 text-center text-xs text-muted-foreground italic">
              Aucune option.
            </div>
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t p-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[10px] h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onChange([])}
            >
              Réinitialiser
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
