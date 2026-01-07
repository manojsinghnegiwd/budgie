import { getBudgetForMonth, getCategoryBudgetSum } from "@/app/actions/budget";
import { getExpenseStats } from "@/app/actions/expenses";
import { getMonthForecast } from "@/app/actions/forecast";
import { DashboardStats } from "@/components/dashboard-stats";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsSectionProps {
  month: number;
  year: number;
  viewUserId: string | null;
  categoryIds: string[] | null;
}

export async function StatsSection({ month, year, viewUserId, categoryIds }: StatsSectionProps) {
  const [globalBudget, stats, forecast] = await Promise.all([
    getBudgetForMonth(month, year),
    getExpenseStats(viewUserId, month, year, false, categoryIds),
    getMonthForecast(viewUserId, month, year, categoryIds),
  ]);

  // If categoryIds is provided, use category budget sum; otherwise use global budget
  const categoryBudgetSum = categoryIds 
    ? await getCategoryBudgetSum(viewUserId, categoryIds, month, year)
    : null;
  
  const budget = categoryBudgetSum !== null 
    ? { ...globalBudget, monthlyLimit: categoryBudgetSum }
    : globalBudget;

  if (!budget || !stats) {
    return (
      <>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  return (
    <DashboardStats 
      stats={stats} 
      budget={budget} 
      forecastAmount={forecast?.totalAmount ?? 0} 
    />
  );
}

