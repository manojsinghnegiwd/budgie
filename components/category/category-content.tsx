import { Suspense } from "react";
import { CategoryStatsSection } from "@/components/category/category-stats-section";
import { CategoryBudgetSection } from "@/components/category/category-budget-section";
import { CategoryTrendsSection } from "@/components/category/category-trends-section";
import { CategoryExpensesSection } from "@/components/category/category-expenses-section";
import {
  StatsSkeleton,
  BudgetCategorySkeleton,
  TrendsSkeleton,
} from "@/components/dashboard/section-skeletons";

interface CategoryContentProps {
  userId: string;
  categoryId: string;
  categoryName: string;
  month: number;
  year: number;
}

export function CategoryContent({ userId, categoryId, categoryName, month, year }: CategoryContentProps) {
  return (
    <>
      {/* Stats Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Suspense key={`category-stats-${categoryId}-${month}-${year}`} fallback={<StatsSkeleton />}>
          <CategoryStatsSection userId={userId} categoryId={categoryId} month={month} year={year} />
        </Suspense>
      </div>

      {/* Budget Section */}
      <Suspense key={`category-budget-${categoryId}-${month}-${year}`} fallback={null}>
        <div className="grid gap-6 md:grid-cols-2">
          <CategoryBudgetSection userId={userId} categoryId={categoryId} month={month} year={year} />
        </div>
      </Suspense>

      {/* Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense key={`category-trends-${categoryId}-${month}-${year}`} fallback={<TrendsSkeleton />}>
          <CategoryTrendsSection userId={userId} categoryId={categoryId} month={month} year={year} />
        </Suspense>
      </div>

      {/* Expenses Table */}
      <Suspense key={`category-expenses-${categoryId}-${month}-${year}`} fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}>
        <CategoryExpensesSection 
          userId={userId} 
          categoryId={categoryId} 
          categoryName={categoryName}
          month={month} 
          year={year} 
        />
      </Suspense>
    </>
  );
}

