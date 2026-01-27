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
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-1 items-center space-x-2 w-full lg:w-auto">
          {showSearch && (
            <div className="relative w-full lg:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 h-8"
              />
            </div>
          )}
          
          {/* Faceted Filters Area */}
          <div className="hidden lg:flex items-center space-x-2">
            {table.getAllColumns().filter(col => col.getCanFilter() && col.columnDef.meta?.filterComponent).map(column => (
              <React.Fragment key={column.id}>
                {column.columnDef.meta?.filterComponent?.({ column, table })}
              </React.Fragment>
            ))}
            {columnFilters.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => table.resetColumnFilters()}
                className="h-8 px-2 lg:px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Réinitialiser
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden h-8"
              onClick={() => setIsFilterOpen((v) => !v)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
              {isFilterOpen && <X className="h-4 w-4 ml-2" />}
            </Button>
          )}
        </div>

        {showPagination && (
          <div className="flex items-center space-x-2">
             <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-[120px] h-8">
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
          </div>
        )}
      </div>

      {/* Filters mobile */}
      {showFilters && isFilterOpen && (
        <div className="lg:hidden space-y-2 border p-4 rounded-lg bg-gray-50/50">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Filtres avancés</p>
          {table
            .getAllColumns()
            .filter((col) => col.getCanFilter() && col.columnDef.meta?.filterComponent)
            .map((column) => (
              <div key={column.id} className="space-y-1">
                <label className="text-xs font-medium text-gray-600">{column.columnDef.header as string}</label>
                {column.columnDef.meta?.filterComponent?.({
                  column,
                  table,
                })}
              </div>
            ))}
            {columnFilters.length > 0 && (
              <Button
                variant="outline"
                onClick={() => table.resetColumnFilters()}
                className="w-full h-8 text-red-600"
              >
                Tout réinitialiser
              </Button>
            )}
        </div>
      )}

      {/* Table desktop */}
      <div className="hidden lg:block border rounded-md bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="bg-gray-50/50">
                {group.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 text-xs font-bold text-gray-700 uppercase tracking-wider">
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
                <TableRow key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
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
                <TableCell colSpan={columns.length} className="text-center h-24 text-gray-500 italic">
                  Aucun résultat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <div key={row.id} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
              {row.getVisibleCells().map((cell) => (
                <div key={cell.id} className="flex flex-col space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {cell.column.columnDef.meta?.mobileLabel ??
                      (typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id)}
                  </span>
                  <div className="text-sm">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="text-center py-10 border rounded-lg italic text-gray-500">
            Aucun résultat
          </div>
        )}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500 font-medium">
            Affichage de {currentPage * table.getState().pagination.pageSize + 1} à {Math.min((currentPage + 1) * table.getState().pagination.pageSize, data.length)} sur {data.length} résultats
          </span>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
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
