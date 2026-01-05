"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/user-provider";
import { getExpenses } from "@/app/actions/expenses";
import { getCategories } from "@/app/actions/categories";
import { ExpensesTable } from "@/components/expenses-table";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, SlidersHorizontal, ChevronUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Expense, Category, User } from "@/lib/prisma";

export default function ExpensesPage() {
  const { selectedUserId } = useUser();
  const [expenses, setExpenses] = useState<(Expense & { category: Category; user: User })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseType, setExpenseType] = useState<"all" | "regular" | "recurring" | "reminder">("all");
  const [includeProjected, setIncludeProjected] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Check if any filters are active
  const hasActiveFilters = expenseType !== "all" || !includeProjected || startDate || endDate;

  const loadData = useCallback(async (showLoading = true) => {
    if (!selectedUserId) {
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    try {
      const [expensesData, categoriesData] = await Promise.all([
        getExpenses(selectedUserId, {
          type: expenseType === "all" ? undefined : expenseType,
          includeProjected: includeProjected ? undefined : false,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        }),
        getCategories(),
      ]);
      setExpenses(expensesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, expenseType, includeProjected, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    await loadData(false);
  }, [loadData]);

  // Listen for refresh event from mobile header
  useEffect(() => {
    const handleRefreshEvent = () => {
      handleRefresh();
    };
    window.addEventListener('refresh-page', handleRefreshEvent);
    return () => window.removeEventListener('refresh-page', handleRefreshEvent);
  }, [handleRefresh]);

  if (!selectedUserId) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-4">Please select a user from the header.</p>
        </div>
      </PullToRefresh>
    );
  }

  if (loading) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">Expenses</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-8 w-8 md:h-9 md:w-9"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="hidden md:block">
            <AddExpenseDialog categories={categories} />
          </div>
        </div>
        {/* Mobile Filter Toggle */}
        <div className="mb-4 md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
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
          <Tabs value={expenseType} onValueChange={(value) => setExpenseType(value as typeof expenseType)}>
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
                onCheckedChange={setIncludeProjected}
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
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full md:w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="end-date" className="text-sm whitespace-nowrap">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full md:w-auto"
                />
              </div>
              {(startDate || endDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
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
        <ExpensesTable expenses={expenses} categories={categories} />
      </div>
    </PullToRefresh>
  );
}
