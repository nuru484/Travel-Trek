// src/components/posts/PostsTableSkeleton.tsx
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableSkeletonProps {
  rows?: number;
}

export function DataTableSkeleton({ rows = 10 }: DataTableSkeletonProps) {
  return (
    <div className="w-full max-w-full space-y-4">
      {/* Header Actions Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Checkbox column */}
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              {/* Title column */}
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              {/* Author column */}
              <TableHead>
                <Skeleton className="h-4 w-14" />
              </TableHead>
              {/* Status column */}
              <TableHead>
                <Skeleton className="h-4 w-12" />
              </TableHead>
              {/* Featured column */}
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              {/* Date column */}
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
              {/* Actions column */}
              <TableHead className="w-20">
                <Skeleton className="h-4 w-14" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index}>
                {/* Checkbox */}
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                {/* Title */}
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full max-w-[300px]" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </TableCell>
                {/* Author */}
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </TableCell>
                {/* Status */}
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                {/* Featured */}
                <TableCell>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </TableCell>
                {/* Date */}
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </TableCell>
                {/* Actions */}
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-24" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}
