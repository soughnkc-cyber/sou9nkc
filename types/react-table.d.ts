import React from "react";
import { Column, Table, ColumnMeta } from "@tanstack/react-table";

export type FilterComponentProps<T> = {
  column: Column<T, unknown>;
  table: Table<T>;
};

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    mobileLabel?: string;
    filterable?: boolean;
    filterComponent?: (props: {
      column: import("@tanstack/react-table").Column<TData, TValue>;
      table: import("@tanstack/react-table").Table<TData>;
    }) => React.ReactNode;
  }
}
