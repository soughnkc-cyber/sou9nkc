"use client";

import React from "react";
import { Column, ColumnDef, Table } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function createColumn<T>(config: {
  accessorKey?: keyof T & string;
  accessorFn?: (originalRow: T) => any;
  id?: string;
  header: string;
  isPrimary?: boolean;
  mobileLabel?: string;
  hideMobileLabel?: boolean;
  sortable?: boolean;
  filterFn?: any;
  filterComponent?: (props: {
    column: Column<T, unknown>;
    table: Table<T>;
  }) => React.ReactNode;
  cell?: (props: any) => React.ReactNode;
  hideSortIcon?: boolean;
}): ColumnDef<T> {

  const column: Partial<ColumnDef<T>> = {
    header: ({ column }) =>
      config.sortable && !config.hideSortIcon ? (
        <Button
          variant="ghost"
          className="p-0"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          {config.header}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        config.header
      ),

    cell: config.cell,
    enableColumnFilter: !!config.filterComponent,
    filterFn: config.filterFn || ((row: any, id: string, filterValue: any) => {
      if (Array.isArray(filterValue)) {
        const val = row.getValue(id);
        return filterValue.includes(val);
      }
      return true;
    }),
    meta: {
      title: config.header,
      isPrimary: config.isPrimary,
      mobileLabel: config.mobileLabel ?? config.header,
      hideMobileLabel: config.hideMobileLabel,
      filterComponent: config.filterComponent,
    },
  };

  if (config.accessorKey) (column as any).accessorKey = config.accessorKey;
  if (config.accessorFn) (column as any).accessorFn = config.accessorFn;
  if (config.id) (column as any).id = config.id;

  return column as ColumnDef<T>;
}

export function createSelectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
      />
    ),
    enableSorting: false,
    meta: { mobileLabel: "Select" },
  };
}

export function createActionsColumn<T>(actions: {
  onClick: (row: T) => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}[]): ColumnDef<T> {
  return {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        {actions.map((a, i) => (
          <Button
            key={i}
            size="sm"
            variant="ghost"
            className={a.className}
            onClick={() => a.onClick(row.original)}
          >
            {a.icon && <a.icon className="h-4 w-4" />}
          </Button>
        ))}
      </div>
    ),
    meta: { mobileLabel: "Actions" },
  };
}


export function createSelectFilter<T>(
  options: { value: string; label: string }[]
): (props: { column: Column<T, unknown>; table: Table<T> }) => React.ReactNode {
  return function SelectFilter({ column }) {
    const value = column.getFilterValue() as string | undefined;

    return (
      <Select
        value={value ?? "__all__"}
        onValueChange={(v) =>
          column.setFilterValue(v === "__all__" ? undefined : v)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Tous" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    title?: string;
    isPrimary?: boolean;
    mobileLabel?: string;
    hideMobileLabel?: boolean;
    filterComponent?: (props: {
      column: Column<TData, TValue>;
      table: Table<TData>;
    }) => React.ReactNode;
  }
}

export function createFacetedFilter<T>(
  title: string,
  options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
): (props: { column: Column<T, unknown>; table: Table<T> }) => React.ReactNode {
  const { DataTableFacetedFilter } = require("./datatable-faceted-filter");
  return function FacetedFilter({ column }) {
    return (
      <DataTableFacetedFilter
        column={column}
        title={title}
        options={options}
      />
    );
  };
}
