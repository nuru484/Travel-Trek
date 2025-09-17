// src/components/ui/DataTablePagination.tsx
"use client";
import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
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
  Database,
  Users,
} from "lucide-react";

interface ITablePaginationProps<TData> {
  table: Table<TData>;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function DataTablePagination<TData>({
  table,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: ITablePaginationProps<TData>) {
  const selectedCount = table.getSelectedRowModel().rows.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 p-6 bg-card border-t border-border">
      {/* Selected count and total */}
      <div className="flex items-center gap-2 text-sm">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          {selectedCount > 0 ? (
            <Users className="w-4 h-4 text-primary" />
          ) : (
            <Database className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="text-muted-foreground">
          {selectedCount > 0 ? (
            <>
              <span className="text-foreground font-semibold">
                {selectedCount}
              </span>
              {" of "}
              <span className="text-foreground font-semibold">
                {totalCount}
              </span>
              {" selected"}
            </>
          ) : (
            <>
              <span className="text-foreground font-semibold">
                {totalCount}
              </span>
              {" total items"}
            </>
          )}
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
        {/* Page size selector */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
          <label
            htmlFor="page-size"
            className="text-sm font-medium text-muted-foreground whitespace-nowrap"
          >
            Rows per page:
          </label>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger
              id="page-size"
              className="h-9 w-[80px] bg-background border-border focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 cursor-pointer"
            >
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent
              side="top"
              className="min-w-[80px] bg-card border-border"
            >
              {[5, 10, 20, 30, 50, 100].map((size) => (
                <SelectItem
                  key={size}
                  value={size.toString()}
                  className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page info and navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="px-3 py-2 bg-muted/30 rounded-lg border border-border">
              <span className="text-muted-foreground">Page </span>
              <span className="text-foreground font-bold">{page}</span>
              <span className="text-muted-foreground"> of </span>
              <span className="text-foreground font-bold">{totalPages}</span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() => onPageChange?.(1)}
              disabled={page <= 1}
              aria-label="Go to first page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              disabled={page <= 1}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              aria-label="Go to next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() => onPageChange?.(totalPages)}
              disabled={page >= totalPages}
              aria-label="Go to last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
