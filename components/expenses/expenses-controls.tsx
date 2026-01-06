"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useUser } from "@/components/user-provider";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, SlidersHorizontal, ChevronUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/prisma";

interface ExpensesControlsProps {
  categories: Category[];
  expenseType: "all" | "regular" | "recurring" | "reminder";
  includeProjected: boolean;
  startDate: string;
  endDate: string;
  filtersOpen: boolean;
  onExpenseTypeChange: (value: "all" | "regular" | "recurring" | "reminder") => void;
  onIncludeProjectedChange: (value: boolean) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onFiltersToggle: () => void;
  onRefresh: () => void;
}

export function ExpensesControls({
  categories,
  expenseType,
  includeProjected,
  startDate,
  endDate,
  filtersOpen,
  onExpenseTypeChange,
  onIncludeProjectedChange,
  onStartDateChange,
  onEndDateChange,
  onFiltersToggle,
  onRefresh,
}: ExpensesControlsProps) {
  const { selectedUserId } = useUser();
  const router = useRouter();

  const hasActiveFilters = expenseType !== "all" || !includeProjected || startDate || endDate;

  // Listen for refresh event from mobile header
  useEffect(() => {
    const handleRefreshEvent = () => {
      onRefresh();
    };
    window.addEventListener('refresh-page', handleRefreshEvent);
    return () => window.removeEventListener('refresh-page', handleRefreshEvent);
  }, [onRefresh]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Expenses</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="h-8 w-8 md:h-9 md:w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="hidden md:block">
          {selectedUserId && <AddExpenseDialog categories={categories} />}
        </div>
      </div>
      {/* Mobile Filter Toggle */}
      <div className="mb-4 md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={onFiltersToggle}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                !
              </span>
            )}
          </span>
          <ChevronUp className={cn("h-4 w-4 transition-transform", !filtersOpen && "rotate-180")} />
        </Button>
      </div>

      {/* Filters Section - Collapsible on mobile, always visible on desktop */}
      <div className={cn(
        "mb-6 space-y-4 overflow-hidden transition-all duration-300",
        // On mobile: show/hide based on filtersOpen
        filtersOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
      )}>
        <Tabs value={expenseType} onValueChange={(value) => onExpenseTypeChange(value as typeof expenseType)}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="text-xs md:text-sm">All</TabsTrigger>
            <TabsTrigger value="regular" className="text-xs md:text-sm">Regular</TabsTrigger>
            <TabsTrigger value="recurring" className="text-xs md:text-sm">Recurring</TabsTrigger>
            <TabsTrigger value="reminder" className="text-xs md:text-sm">Reminders</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="include-projected"
              checked={includeProjected}
              onCheckedChange={onIncludeProjectedChange}
            />
            <Label htmlFor="include-projected" className="text-sm">Include projected expenses</Label>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="start-date" className="text-sm whitespace-nowrap">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full md:w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="end-date" className="text-sm whitespace-nowrap">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full md:w-auto"
              />
            </div>
            {(startDate || endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onStartDateChange("");
                  onEndDateChange("");
                }}
                className="w-full md:w-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Dates
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

