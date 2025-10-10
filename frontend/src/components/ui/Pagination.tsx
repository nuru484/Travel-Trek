// src/components/ui/Pagination.tsx
"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  meta,
  onPageChange,
  onLimitChange,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 25, 50, 100],
  className = "",
}) => {
  const { total, page: currentPage, limit, totalPages } = meta;

  // Calculate current range
  const startItem = Math.min((currentPage - 1) * limit + 1, total);
  const endItem = Math.min(currentPage * limit, total);

  const getVisiblePages = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    if (totalPages <= 1) return [1];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const handlePageSizeChange = (newLimit: number) => {
    if (onLimitChange) {
      const currentFirstItem = (currentPage - 1) * limit + 1;
      const newPage = Math.ceil(currentFirstItem / newLimit);
      onLimitChange(newLimit);
      onPageChange(Math.max(1, newPage));
    }
  };

  return (
    <div
      className={`flex flex-col lg:flex-row items-center justify-between gap-6 p-6 bg-card border-t border-border ${className}`}
    >
      {/* Data Summary & Page Size Selector */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Data Summary */}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <div className="text-muted-foreground">
            <span className="text-foreground font-semibold">
              {startItem.toLocaleString()}
            </span>
            {" - "}
            <span className="text-foreground font-semibold">
              {endItem.toLocaleString()}
            </span>
            {" of "}
            <span className="text-foreground font-semibold">
              {total.toLocaleString()}
            </span>
            {" entries"}
          </div>
        </div>

        {/* Page Size Selector */}
        {showPageSizeSelector && onLimitChange && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
            <label
              htmlFor="pageSize"
              className="text-sm font-medium text-muted-foreground"
            >
              Show:
            </label>

            <Select
              value={limit.toString()}
              onValueChange={(value) => handlePageSizeChange(Number(value))}
            >
              <SelectTrigger
                id="pageSize"
                className="h-9 w-[90px] bg-background border-border focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 cursor-pointer"
              >
                <SelectValue placeholder={limit} />
              </SelectTrigger>
              <SelectContent className="min-w-[90px] bg-card border-border">
                {pageSizeOptions.map((option) => (
                  <SelectItem
                    key={option}
                    value={option.toString()}
                    className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-sm text-muted-foreground font-medium">
              per page
            </span>
          </div>
        )}
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-center gap-1">
        {/* First Page Button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="p-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-muted-foreground disabled:hover:border-border transition-all duration-200 cursor-pointer"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-muted-foreground disabled:hover:border-border transition-all duration-200 cursor-pointer"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        {getVisiblePages().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`min-w-[40px] px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200 ${
              page === currentPage
                ? "bg-gradient-brand text-foreground border-primary shadow-md shadow-primary/20 scale-105"
                : page === "..."
                ? "border-transparent text-muted-foreground cursor-default bg-transparent"
                : "border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/20 hover:scale-105 cursor-pointer"
            }`}
            title={typeof page === "number" ? `Go to page ${page}` : undefined}
          >
            {page}
          </button>
        ))}

        {/* Next Page Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-muted-foreground disabled:hover:border-border transition-all duration-200 cursor-pointer"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-muted-foreground disabled:hover:border-border transition-all duration-200 cursor-pointer"
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Page Info */}
      <div className="flex items-center gap-2 text-sm">
        <div className="px-3 py-2 bg-muted/30 rounded-lg border border-border">
          <span className="text-muted-foreground">Page </span>
          <span className="text-foreground font-bold">{currentPage}</span>
          <span className="text-muted-foreground"> of </span>
          <span className="text-foreground font-bold">{totalPages}</span>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
