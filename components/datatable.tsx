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
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { DataTableViewOptions } from "@/components/datatable-view-options";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  showViewOptions?: boolean;
  className?: string;
  onSelectionChange?: (selectedRows: TData[]) => void;
  extraSearchActions?: React.ReactNode;
  getRowClassName?: (row: TData) => string;
  mobileRowAction?: (row: TData) => React.ReactNode;
}


export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Rechercher...",
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 10,
  showSearch = true,
  showFilters = true,
  showPagination = true,
  showViewOptions = true,
  className,
  onSelectionChange,
  extraSearchActions,
  getRowClassName,
  mobileRowAction,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);


  /* Visibility state */
  const [columnVisibility, setColumnVisibility] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const newVal = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(newVal);
    },

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

  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getSelectedRowModel().flatRows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, table, onSelectionChange]);


  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-1 items-center space-x-2 w-full lg:w-auto">
          {showSearch && (
            <div className="relative w-full lg:w-[320px] group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#1F30AD] transition-colors" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 h-10 rounded-xl border-gray-200 bg-gray-50/30 focus-visible:ring-[#1F30AD] focus-visible:ring-offset-0 focus-visible:border-[#1F30AD] transition-all placeholder:text-gray-400 font-medium"
              />
            </div>
          )}

          {extraSearchActions && (
            <div className="flex items-center space-x-2">
              {extraSearchActions}
            </div>
          )}
          
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden h-10 rounded-xl px-4 font-bold border-gray-200 hover:bg-gray-50 transition-colors"
              onClick={() => setIsFilterOpen((v) => !v)}
            >
              <Filter className="h-4 w-4 mr-2 text-[#1F30AD]" />
              Filtres
              {isFilterOpen && <X className="h-4 w-4 ml-2" />}
            </Button>
          )}

          {showViewOptions && <DataTableViewOptions table={table} />}
        </div>


        {showPagination && (
          <div className="flex items-center space-x-2">
             <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
               <SelectTrigger className="w-[130px] h-10 rounded-xl border-gray-200 bg-gray-50/30 transition-all font-bold">
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
      <div className="hidden lg:block border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
                {group.headers.map((header) => (
                  <TableHead key={header.id} className="h-12 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest pl-4">
                    <div className="flex flex-col gap-2">
                      {!(header.column.getCanFilter() && header.column.columnDef.meta?.filterComponent) && flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanFilter() && header.column.columnDef.meta?.filterComponent && (
                        <div className="normal-case font-normal">
                          {header.column.columnDef.meta.filterComponent({ 
                            column: header.column, 
                            table: table 
                          })}
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id} 
                  className={cn(
                    "hover:bg-blue-50/30 transition-colors border-b border-gray-50 group relative",
                    row.getIsSelected() && "bg-blue-50/50"
                  )}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell key={cell.id} className={cn("py-4 pl-4", index === 0 && "relative")}>
                      {index === 0 && row.getIsSelected() && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1F30AD] rounded-r-full" />
                      )}
                      <div className="text-[13px] font-medium text-gray-700">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-32 text-gray-400 italic">
                  Aucun résultat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination component logic removed from main return for length, assuming it's below */}

      {/* Mobile cards */}
      <div className="lg:hidden space-y-4">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            const isRowExpanded = expandedRows[row.id] || false;
            const toggleRow = () => {
              setExpandedRows(prev => ({
                ...prev,
                [row.id]: !isRowExpanded
              }));
            };
            
            const visibleCells = row.getVisibleCells();
            const selectCell = visibleCells.find(cell => cell.column.id === "select");
            
            // Primary columns (marked as isPrimary or fallback to first 2)
            let primaryCells = visibleCells.filter(cell => cell.column.columnDef.meta?.isPrimary);
            if (primaryCells.length === 0) {
              primaryCells = visibleCells.filter(c => c.column.id !== "select" && c.column.id !== "actions").slice(0, 2);
            }
            
            const secondaryCells = visibleCells.filter(cell => !primaryCells.includes(cell) && cell.column.id !== "select" && cell.column.id !== "actions");

            return (
              <div 
                key={row.id} 
                className={cn(
                  "border border-gray-100 rounded-2xl bg-white shadow-xs overflow-hidden transition-all duration-300",
                  isRowExpanded ? "ring-1 ring-blue-200 shadow-md" : "",
                  row.getIsSelected() ? "bg-blue-50/30 border-blue-200" : "",
                  getRowClassName ? getRowClassName(row.original) : ""
                )}
              >
                {/* Mobile Card Header (Always visible) */}
                <div 
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer active:bg-gray-50 transition-colors"
                  onClick={toggleRow}
                >
                  <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    {selectCell && (
                      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {flexRender(selectCell.column.columnDef.cell, selectCell.getContext())}
                      </div>
                    )}
                    <div className="flex flex-1 items-center justify-between gap-3 overflow-hidden">
                        {/* Left side: Stacked Info (Number + Product) */}
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                            {primaryCells.slice(0, 2).map((cell) => (
                                <div key={cell.id} className="text-sm font-bold text-gray-900 truncate">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </div>
                            ))}
                        </div>
                        
                        {/* Right side: Status and/or other primaries */}
                        <div className="flex items-center gap-2">
                            {primaryCells.slice(2).map((cell) => (
                                <div key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {mobileRowAction && mobileRowAction(row.original) ? (
                       mobileRowAction(row.original)
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "h-8 w-8 rounded-full border border-gray-200 transition-all",
                          isRowExpanded ? "bg-[#1F30AD] border-[#1F30AD] text-white rotate-180" : "text-gray-400"
                        )}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mobile Card Expanded Details */}
                {isRowExpanded && (
                  <div className="px-4 pb-4 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="h-px bg-gray-50 -mx-4 mb-4" />
                    <div className="grid grid-cols-2 gap-4">
                      {secondaryCells.map((cell) => (
                        <div key={cell.id} className="flex flex-col space-y-1">
                          {!cell.column.columnDef.meta?.hideMobileLabel && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                              {cell.column.columnDef.meta?.title || cell.column.id}
                            </span>
                          )}
                          <div className="text-[13px] font-medium text-gray-700">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white border border-dashed rounded-2xl italic text-gray-400">
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
