"use client";

import { motion } from "framer-motion";
import { Search, Filter, ArrowUpDown, ChevronDown, X } from "lucide-react";
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

  return (
    <motion.div {...fadeUp()} className={className}>
      <Card className="border-border">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
              {searchValue && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => onSearchChange("")}
                >
                  <X size={14} />
                </Button>
              )}
            </div>

            {/* Filter & Sort buttons */}
            <div className="flex gap-2">
              {hasFilters && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                      <Filter size={14} />
                      <span className="sm:hidden">Filter</span>
                      <span className="hidden sm:inline">
                        {filterOptions.find((f) => f.value === filterValue)?.label || "Filter"}
                      </span>
                      <ChevronDown size={14} className="hidden sm:inline" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
                    <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                      <ArrowUpDown size={14} />
                      <span className="sm:hidden">Sort</span>
                      <span className="hidden sm:inline">
                        {sortOptions.find((s) => s.value === sortValue)?.label || "Sort"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {sortOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => onSortChange?.(option.value)}
                      >
                        <span className="flex-1">{option.label}</span>
                        {sortValue === option.value && (
                          <span className="text-muted-foreground text-xs">
                            {sortOrder === "asc" ? "ASC" : "DESC"}
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
