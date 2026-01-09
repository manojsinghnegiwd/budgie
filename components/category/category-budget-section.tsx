import { getExpenseStats } from "@/app/actions/expenses";
import { getMonthForecast } from "@/app/actions/forecast";
import { getCategoryBudgetForMonth } from "@/app/actions/categories";
import { getCarryoverAmount } from "@/app/actions/budget";
import { getSettings } from "@/app/actions/settings";
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
  const settings = await getSettings();
  
  const [stats, forecast, budgetLimit, carryover] = await Promise.all([
    getExpenseStats(userId, month, year, false, [categoryId]),
    getMonthForecast(userId, month, year, [categoryId]),
    getCategoryBudgetForMonth(userId, categoryId, month, year),
    settings?.enableBudgetCarryover 
      ? getCarryoverAmount(month, year, userId, [categoryId])
      : Promise.resolve(0),
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
      carryoverAmount={carryover}
    />
  );
}

