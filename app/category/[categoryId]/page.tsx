"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/components/user-provider";
import { getExpenseStats, getExpensesByMonth } from "@/app/actions/expenses";
import { getCategories } from "@/app/actions/categories";
import { getMonthForecast } from "@/app/actions/forecast";
import { getCategoryBudgetForMonth } from "@/app/actions/categories";
import { DashboardStats } from "@/components/dashboard-stats";
import { BudgetProgress } from "@/components/budget-progress";
import { SpendingTrends } from "@/components/spending-trends";
import { MonthComparison } from "@/components/month-comparison";
import { ExpensesTable } from "@/components/expenses-table";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Expense, Category, User } from "@/lib/prisma";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;
  const { selectedUserId } = useUser();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [category, setCategory] = useState<Category | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    byCategory: Array<{ name: string; color: string; amount: number; budgetLimit: number | null; categoryId?: string }>;
    count: number;
  } | null>(null);
  const [currentExpenses, setCurrentExpenses] = useState<(Expense & { category: Category; user: User })[]>([]);
  const [previousExpenses, setPreviousExpenses] = useState<(Expense & { category: Category; user: User })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthForecast, setMonthForecast] = useState<{ totalAmount: number; billCount: number; reminderCount: number } | null>(null);
  const [categoryBudget, setCategoryBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (showLoading = true) => {
    if (!selectedUserId || !categoryId) {
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    const previousMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const previousYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

    try {
      const [categoriesData, statsData, currentExpensesData, previousExpensesData, monthForecastData, budgetLimit] =
        await Promise.all([
          getCategories(),
          getExpenseStats(selectedUserId, selectedMonth, selectedYear, false, categoryId),
          getExpensesByMonth(selectedUserId, selectedMonth, selectedYear, true, categoryId),
          getExpensesByMonth(selectedUserId, previousMonth, previousYear, false, categoryId),
          getMonthForecast(selectedUserId, selectedMonth, selectedYear, categoryId),
          getCategoryBudgetForMonth(selectedUserId, categoryId, selectedMonth, selectedYear),
        ]);

      const foundCategory = categoriesData.find((c) => c.id === categoryId);
      if (!foundCategory) {
        router.push("/");
        return;
      }

      setCategory(foundCategory);
      setCategories(categoriesData);
      setStats(statsData);
      setCurrentExpenses(currentExpensesData);
      setPreviousExpenses(previousExpensesData);
      setMonthForecast(monthForecastData);
      setCategoryBudget(budgetLimit);
    } catch (error) {
      console.error("Error loading category data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, categoryId, selectedMonth, selectedYear, router]);

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
          <h1 className="text-2xl md:text-3xl font-bold">Category Details</h1>
          <p className="text-muted-foreground mt-4">Please select a user from the header.</p>
        </div>
      </PullToRefresh>
    );
  }

  if (loading || !category || !stats) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold">Category Details</h1>
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

  // Create a mock budget object for BudgetProgress component
  const mockBudget = {
    id: "category-budget",
    userId: selectedUserId,
    monthlyLimit: categoryBudget || 0,
    month: selectedMonth,
    year: selectedYear,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              {category.icon && <span className="text-3xl">{category.icon}</span>}
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    {category.name}
                    <Badge
                      style={{
                        backgroundColor: category.color + "20",
                        color: category.color,
                        borderColor: category.color,
                      }}
                      className="text-xs"
                    >
                      Category
                    </Badge>
                  </h1>
                {categoryBudget !== null && categoryBudget > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Budget: {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(categoryBudget)}
                  </p>
                )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  className="h-8 w-8 md:h-9 md:w-9"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
            <AddExpenseDialog categories={categories} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DashboardStats stats={stats} budget={mockBudget} forecastAmount={monthForecast?.totalAmount ?? 0} />
        </div>

        {categoryBudget !== null && categoryBudget > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            <BudgetProgress 
              budget={mockBudget} 
              spent={stats.total} 
              forecastAmount={monthForecast?.totalAmount ?? 0} 
            />
          </div>
        )}

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

        <Card>
          <CardHeader>
            <CardTitle>Expenses for {category.name}</CardTitle>
            <CardDescription>All expenses for {monthNames[selectedMonth - 1]} {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesTable expenses={currentExpenses} categories={categories} />
          </CardContent>
        </Card>
      </div>
    </PullToRefresh>
  );
}

