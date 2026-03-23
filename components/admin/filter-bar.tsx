"use client";

import { motion } from "framer-motion";
import { Search, Filter, ArrowUpDown, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterOptions?: FilterOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  sortOptions?: SortOption[];
  sortValue?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (value: string) => void;
  className?: string;
}

const fadeUp = () => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 280, damping: 24 },
});

export function FilterBar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filterOptions,
  filterValue,
  onFilterChange,
  sortOptions,
  sortValue,
  sortOrder,
  onSortChange,
  className,
}: FilterBarProps) {
  const hasFilters = filterOptions && filterOptions.length > 0;
  const hasSort = sortOptions && sortOptions.length > 0;
  const hasMultipleActions = (hasFilters ? 1 : 0) + (hasSort ? 1 : 0) > 1;

  return (
    <motion.div {...fadeUp()} className={className}>
      <Card className="border-border">
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
              {searchValue && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => onSearchChange("")}
                >
                  <X size={12} />
                </Button>
              )}
            </div>

            {/* Filter & Sort buttons */}
            <div className="flex gap-2">
              {hasFilters && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-1.5 h-8 sm:h-9 text-xs sm:text-sm justify-start">
                      <Filter size={12} className="sm:size-4 shrink-0" />
                      <span className="truncate">
                        {filterOptions.find((f) => f.value === filterValue)?.label || "Filter"}
                      </span>
                      <ChevronDown size={12} className="sm:size-4 ml-auto shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[180px]">
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {filterOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => onFilterChange?.(option.value)}
                        className={cn(filterValue === option.value && "bg-accent")}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {hasSort && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-1.5 h-8 sm:h-9 text-xs sm:text-sm justify-start">
                      <ArrowUpDown size={12} className="sm:size-4 shrink-0" />
                      <span className="truncate">
                        {sortOptions.find((s) => s.value === sortValue)?.label || "Sort"}
                      </span>
                      {sortValue && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto shrink-0">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[180px]">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {sortOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => onSortChange?.(option.value)}
                        className="flex justify-between gap-4"
                      >
                        <span>{option.label}</span>
                        {sortValue === option.value && (
                          <span className="text-muted-foreground text-xs">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
