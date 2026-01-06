import { getExpenseStats } from "@/app/actions/expenses";
import { getMonthForecast } from "@/app/actions/forecast";
import { getCategoryBudgetForMonth } from "@/app/actions/categories";
import { BudgetProgress } from "@/components/budget-progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryBudgetSectionProps {
  userId: string;
  categoryId: string;
  month: number;
  year: number;
}

export async function CategoryBudgetSection({ userId, categoryId, month, year }: CategoryBudgetSectionProps) {
  const [stats, forecast, budgetLimit] = await Promise.all([
    getExpenseStats(userId, month, year, false, categoryId),
    getMonthForecast(userId, month, year, categoryId),
    getCategoryBudgetForMonth(userId, categoryId, month, year),
  ]);

  if (!stats || budgetLimit === null || budgetLimit === 0) {
    return null;
  }

  const mockBudget = {
    id: "category-budget",
    userId,
    monthlyLimit: budgetLimit,
    month,
    year,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <BudgetProgress 
      budget={mockBudget} 
      spent={stats.total} 
      forecastAmount={forecast?.totalAmount ?? 0} 
    />
  );
}

