"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/components/user-provider";
import { getBudgetForMonth } from "@/app/actions/budget";
import { getExpenseStats, getExpensesByMonth } from "@/app/actions/expenses";
import { getCategories } from "@/app/actions/categories";
import { getMonthForecast } from "@/app/actions/forecast";
import { getInvestmentStats } from "@/app/actions/investments";
import { DashboardStats } from "@/components/dashboard-stats";
import { BudgetProgress } from "@/components/budget-progress";
import { CategoryChart } from "@/components/category-chart";
import { SpendingTrends } from "@/components/spending-trends";
import { MonthComparison } from "@/components/month-comparison";
import { FutureForecast } from "@/components/future-forecast";
import { QuickAddExpense } from "@/components/quick-add-expense";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { InvestmentSummaryCard } from "@/components/investment-stats";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Budget, Expense, Category } from "@/lib/prisma";

export default function Dashboard() {
  const { selectedUserId } = useUser();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [budget, setBudget] = useState<Budget | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    byCategory: Array<{ name: string; color: string; amount: number }>;
    count: number;
  } | null>(null);
  const [currentExpenses, setCurrentExpenses] = useState<(Expense & { category: Category })[]>([]);
  const [previousExpenses, setPreviousExpenses] = useState<(Expense & { category: Category })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthForecast, setMonthForecast] = useState<{ totalAmount: number; billCount: number; reminderCount: number } | null>(null);
  const [investmentStats, setInvestmentStats] = useState<{
    totalInvested: number;
    totalCurrentValue: number;
    totalGainLoss: number;
    gainLossPercentage: number;
    count: number;
    byType: Array<{ type: string; invested: number; currentValue: number; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (showLoading = true) => {
    if (!selectedUserId) {
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    const previousMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const previousYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

    try {
      const [budgetData, statsData, currentExpensesData, previousExpensesData, categoriesData, monthForecast, investmentStatsData] =
        await Promise.all([
          getBudgetForMonth(selectedUserId, selectedMonth, selectedYear),
          getExpenseStats(selectedUserId, selectedMonth, selectedYear, false), // Exclude projected - forecast handles them separately
          getExpensesByMonth(selectedUserId, selectedMonth, selectedYear, true), // Include projected for charts
          getExpensesByMonth(selectedUserId, previousMonth, previousYear, false), // Don't include projected for past
          getCategories(),
          getMonthForecast(selectedUserId, selectedMonth, selectedYear),
          getInvestmentStats(selectedUserId),
        ]);

      setBudget(budgetData);
      setStats(statsData);
      setCurrentExpenses(currentExpensesData);
      setPreviousExpenses(previousExpensesData);
      setCategories(categoriesData);
      setMonthForecast(monthForecast);
      setInvestmentStats(investmentStatsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    await loadData(false);
  }, [loadData]);

  if (!selectedUserId) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-4">Please select a user from the header.</p>
        </div>
      </PullToRefresh>
    );
  }

  if (loading || !budget || !stats) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </PullToRefresh>
    );
  }

  // Generate month options
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate year options (current year ± 5 years)
  const currentYear = now.getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-[120px] md:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-[90px] md:w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="hidden md:block">
            <QuickAddExpense categories={categories} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DashboardStats stats={stats} budget={budget} forecastAmount={monthForecast?.totalAmount ?? 0} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <BudgetProgress budget={budget} spent={stats.total} forecastAmount={monthForecast?.totalAmount ?? 0} />
          <CategoryChart data={stats.byCategory} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SpendingTrends 
            expenses={currentExpenses} 
            month={selectedMonth}
            year={selectedYear}
          />
          <MonthComparison
            currentExpenses={currentExpenses}
            previousExpenses={previousExpenses}
            currentMonth={selectedMonth}
            currentYear={selectedYear}
          />
        </div>

        {investmentStats && (
          <div className="grid gap-6 md:grid-cols-2">
            <InvestmentSummaryCard stats={investmentStats} />
          </div>
        )}

        <FutureForecast userId={selectedUserId} />
      </div>
    </PullToRefresh>
  );
}
