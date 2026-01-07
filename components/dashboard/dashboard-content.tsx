import { Suspense } from "react";
import { StatsSection } from "@/components/dashboard/stats-section";
import { TrendsSection } from "@/components/dashboard/trends-section";
import { ExpensesSection } from "@/components/dashboard/expenses-section";
import {
  StatsSkeleton,
  TrendsSkeleton,
  ExpensesSkeleton,
} from "@/components/dashboard/section-skeletons";

interface DashboardContentProps {
  month: number;
  year: number;
  viewUserId: string | null;
  categoryIds: string[] | null;
}

export function DashboardContent({ month, year, viewUserId, categoryIds }: DashboardContentProps) {
  const suspenseKey = `${month}-${year}-${viewUserId}-${categoryIds?.join(",") || "all"}`;
  
  return (
    <>
      {/* Stats Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Suspense key={`stats-${suspenseKey}`} fallback={<StatsSkeleton />}>
          <StatsSection month={month} year={year} viewUserId={viewUserId} categoryIds={categoryIds} />
        </Suspense>
      </div>

      {/* Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense key={`trends-${suspenseKey}`} fallback={<TrendsSkeleton />}>
          <TrendsSection month={month} year={year} viewUserId={viewUserId} categoryIds={categoryIds} />
        </Suspense>
      </div>

      {/* Expenses Table */}
      <Suspense key={`expenses-${suspenseKey}`} fallback={<ExpensesSkeleton />}>
        <ExpensesSection month={month} year={year} viewUserId={viewUserId} categoryIds={categoryIds} />
      </Suspense>
    </>
  );
}

