"use client";

import * as React from "react";
import { Column } from "@tanstack/react-table";
import { Check, ChevronDown, PlusCircle, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  trigger?: React.ReactNode;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  trigger,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 px-2 font-bold text-gray-500 hover:text-gray-900 group whitespace-nowrap">
            {title}
            <ChevronDown className="ml-1 h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            {selectedValues?.size > 0 && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <Badge
                  variant="secondary"
                  className="rounded-lg px-1.5 py-0 font-bold bg-blue-50 text-[#1F30AD] border-blue-100 text-[10px]"
                >
                  {selectedValues.size}
                </Badge>
              </>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="flex flex-col h-full max-h-[300px]">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder={title}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="overflow-y-auto overflow-x-hidden p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-sm text-center text-muted-foreground">
                Aucun résultat trouvé.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => {
                  const isSelected = selectedValues.has(option.value);
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
                        isSelected && "bg-accent/50"
                      )}
                      onClick={() => {
                        if (isSelected) {
                          selectedValues.delete(option.value);
                        } else {
                          selectedValues.add(option.value);
                        }
                        const filterValues = Array.from(selectedValues);
                        column?.setFilterValue(
                          filterValues.length ? filterValues : undefined
                        );
                      }}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className={cn("h-4 w-4")} />
                      </div>
                      {option.icon && (
                        <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="flex-1">{option.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {selectedValues.size > 0 && (
            <>
              <Separator />
              <Button
                variant="ghost"
                size="sm"
                className="justify-center text-center font-normal rounded-none h-9 mt-1"
                onClick={() => column?.setFilterValue(undefined)}
              >
                Réinitialiser
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
