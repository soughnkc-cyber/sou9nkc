"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface Option {
  id: string;
  name: string;
}

interface AgentSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function AgentSelect({
  options,
  selected,
  onChange,
  placeholder = "Sélectionner...",
}: AgentSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggleOption = (id: string) => {
    const newSelected = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(newSelected);
  };

  const selectedLabels = options
    .filter((opt) => selected.includes(opt.id))
    .map((opt) => opt.name);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[40px] h-auto py-2"
        >
          <div className="flex flex-wrap gap-1">
            {selectedLabels.length > 0 ? (
              selectedLabels.map((label) => (
                <Badge key={label} variant="secondary" className="mr-1">
                  {label}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="max-h-[300px] overflow-auto p-1">
          {options.length === 0 ? (
            <div className="p-2 text-sm text-center text-muted-foreground">
              Aucun agent trouvé
            </div>
          ) : (
            options.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                onClick={() => toggleOption(option.id)}
              >
                <Checkbox
                  id={`agent-${option.id}`}
                  checked={selected.includes(option.id)}
                  onCheckedChange={() => toggleOption(option.id)}
                />
                <label
                  htmlFor={`agent-${option.id}`}
                  className="text-sm font-medium leading-none cursor-pointer flex-1"
                >
                  {option.name}
                </label>
                {selected.includes(option.id) && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
