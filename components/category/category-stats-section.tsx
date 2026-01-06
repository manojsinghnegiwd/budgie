import { getExpenseStats } from "@/app/actions/expenses";
import { getMonthForecast } from "@/app/actions/forecast";
import { getCategoryBudgetForMonth } from "@/app/actions/categories";
import { DashboardStats } from "@/components/dashboard-stats";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryStatsSectionProps {
  userId: string;
  categoryId: string;
  month: number;
  year: number;
}

export async function CategoryStatsSection({ userId, categoryId, month, year }: CategoryStatsSectionProps) {
  const [stats, forecast, budgetLimit] = await Promise.all([
    getExpenseStats(userId, month, year, false, categoryId),
    getMonthForecast(userId, month, year, categoryId),
    getCategoryBudgetForMonth(userId, categoryId, month, year),
  ]);

  if (!stats) {
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

  const mockBudget = {
    id: "category-budget",
    userId,
    monthlyLimit: budgetLimit || 0,
    month,
    year,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <DashboardStats 
      stats={stats} 
      budget={mockBudget} 
      forecastAmount={forecast?.totalAmount ?? 0} 
    />
  );
}

