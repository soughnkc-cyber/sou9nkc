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
  isActive?: boolean;
  role?: string;
}

interface AgentSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AgentSelect({
  options,
  selected,
  onChange,
  placeholder = "Sélectionner...",
  disabled = false,
}: AgentSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggleOption = (option: Option) => {
    // If the agent is inactive and not already selected, we don't allow selecting them.
    if (!option.isActive && !selected.includes(option.id)) {
      return;
    }
    
    const newSelected = selected.includes(option.id)
      ? selected.filter((s) => s !== option.id)
      : [...selected, option.id];
    onChange(newSelected);
  };

  const selectedOptions = options.filter((opt) => selected.includes(opt.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between min-h-[40px] h-auto py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-wrap gap-1">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((opt) => (
                <Badge 
                  key={opt.id} 
                  variant="secondary" 
                  className="me-1"
                >
                  {opt.name}
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
            options
              .filter(option => option.isActive && (option.role === "AGENT" || option.role === "AGENT_TEST"))
              .map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                onClick={() => toggleOption(option)}
              >
                <Checkbox
                  id={`agent-${option.id}`}
                  checked={selected.includes(option.id)}
                  onCheckedChange={() => toggleOption(option)}
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
