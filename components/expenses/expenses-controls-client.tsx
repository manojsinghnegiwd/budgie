"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-provider";
import { ExpensesControls } from "@/components/expenses/expenses-controls";
import type { Category } from "@/lib/prisma";

interface ExpensesControlsClientProps {
  categories: Category[];
  initialExpenseType: "all" | "regular" | "recurring" | "reminder";
  initialIncludeProjected: boolean;
  initialStartDate: string;
  initialEndDate: string;
}

export function ExpensesControlsClient({
  categories,
  initialExpenseType,
  initialIncludeProjected,
  initialStartDate,
  initialEndDate,
}: ExpensesControlsClientProps) {
  const router = useRouter();
  const [expenseType, setExpenseType] = useState(initialExpenseType);
  const [includeProjected, setIncludeProjected] = useState(initialIncludeProjected);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const updateUrl = useCallback((updates: {
    type?: string;
    includeProjected?: boolean;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (updates.type && updates.type !== "all") params.set("type", updates.type);
    if (updates.includeProjected === false) params.set("includeProjected", "false");
    if (updates.startDate) params.set("startDate", updates.startDate);
    if (updates.endDate) params.set("endDate", updates.endDate);
    
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : "/expenses", { scroll: false });
  }, [router]);

  const handleExpenseTypeChange = useCallback((value: "all" | "regular" | "recurring" | "reminder") => {
    setExpenseType(value);
    updateUrl({ type: value });
  }, [updateUrl]);

  const handleIncludeProjectedChange = useCallback((value: boolean) => {
    setIncludeProjected(value);
    updateUrl({ includeProjected: value });
  }, [updateUrl]);

  const handleStartDateChange = useCallback((value: string) => {
    setStartDate(value);
    updateUrl({ startDate: value });
  }, [updateUrl]);

  const handleEndDateChange = useCallback((value: string) => {
    setEndDate(value);
    updateUrl({ endDate: value });
  }, [updateUrl]);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <ExpensesControls
      categories={categories}
      expenseType={expenseType}
      includeProjected={includeProjected}
      startDate={startDate}
      endDate={endDate}
      filtersOpen={filtersOpen}
      onExpenseTypeChange={handleExpenseTypeChange}
      onIncludeProjectedChange={handleIncludeProjectedChange}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
      onFiltersToggle={() => setFiltersOpen(!filtersOpen)}
      onRefresh={handleRefresh}
    />
  );
}

