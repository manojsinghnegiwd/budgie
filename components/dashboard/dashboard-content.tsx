import { Suspense } from "react";
import { StatsSection } from "@/components/dashboard/stats-section";
import { BudgetCategorySection } from "@/components/dashboard/budget-category-section";
import { TrendsSection } from "@/components/dashboard/trends-section";
import { ExpensesSection } from "@/components/dashboard/expenses-section";
import { BudgetTabs } from "@/components/budget-tabs";
import {
  StatsSkeleton,
  BudgetCategorySkeleton,
  TrendsSkeleton,
  ExpensesSkeleton,
} from "@/components/dashboard/section-skeletons";

interface DashboardContentProps {
  month: number;
  year: number;
}

export function DashboardContent({ month, year }: DashboardContentProps) {
  return (
    <>
      {/* Stats Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Suspense key={`stats-${month}-${year}`} fallback={<StatsSkeleton />}>
          <StatsSection month={month} year={year} />
        </Suspense>
      </div>

      {/* Budget & Category */}
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense key={`budget-${month}-${year}`} fallback={<BudgetCategorySkeleton />}>
          <BudgetCategorySection month={month} year={year} />
        </Suspense>
      </div>

      {/* Category Budget Tabs */}
      <Suspense key={`tabs-${month}-${year}`} fallback={<div className="h-48 bg-muted animate-pulse rounded-lg" />}>
        <BudgetTabs month={month} year={year} />
      </Suspense>

      {/* Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense key={`trends-${month}-${year}`} fallback={<TrendsSkeleton />}>
          <TrendsSection month={month} year={year} />
        </Suspense>
      </div>

      {/* Expenses Table */}
      <Suspense key={`expenses-${month}-${year}`} fallback={<ExpensesSkeleton />}>
        <ExpensesSection month={month} year={year} />
      </Suspense>
    </>
  );
}

