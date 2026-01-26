"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Rechercher...",
  pageSizeOptions = [5, 10, 20, 50, 100],
  defaultPageSize = 10,
  showSearch = true,
  showFilters = true,
  showPagination = true,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  });

  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        {showSearch && (
          <div className="relative w-full lg:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {showFilters && (
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsFilterOpen((v) => !v)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
            {isFilterOpen && <X className="h-4 w-4 ml-2" />}
          </Button>
        )}

        {showPagination && (
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size} lignes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Filters desktop */}
      {showFilters && (
        <div className="hidden lg:flex gap-2">
          {table
            .getAllColumns()
            .filter((col) => col.getCanFilter())
            .map((column) => (
              <div key={column.id} className="min-w-[150px]">
                {column.columnDef.meta?.filterComponent?.({
                  column,
                  table,
                }) || (
                  <Input
                    placeholder={`Filtrer ${column.id}`}
                    value={(column.getFilterValue() as string) ?? ""}
                    onChange={(e) =>
                      column.setFilterValue(e.target.value)
                    }
                  />
                )}
              </div>
            ))}
        </div>
      )}

      {/* Filters mobile */}
      {showFilters && isFilterOpen && (
        <div className="lg:hidden space-y-2 border p-4 rounded-lg">
          {table
            .getAllColumns()
            .filter((col) => col.getCanFilter())
            .map((column) => (
              <div key={column.id}>
                <label className="text-sm font-medium">{column.id}</label>
                {column.columnDef.meta?.filterComponent?.({
                  column,
                  table,
                }) || (
                  <Input
                    value={(column.getFilterValue() as string) ?? ""}
                    onChange={(e) =>
                      column.setFilterValue(e.target.value)
                    }
                  />
                )}
              </div>
            ))}
        </div>
      )}

      {/* Table desktop */}
      <div className="hidden lg:block border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-24">
                  Aucun résultat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {table.getRowModel().rows.map((row) => (
          <div key={row.id} className="border rounded-lg p-4 space-y-2">
            {row.getVisibleCells().map((cell) => (
              <div key={cell.id} className="flex justify-between">
                <span className="text-sm text-gray-500">
                  {cell.column.columnDef.meta?.mobileLabel ??
                    cell.column.id}
                </span>
                <span>
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page {currentPage + 1} sur {totalPages}
          </span>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.setPageIndex(totalPages - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
