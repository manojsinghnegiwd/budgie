import { getBudgetForMonth, getCategoryBudgetSum } from "@/app/actions/budget";
import { getExpenseStats } from "@/app/actions/expenses";
import { getMonthForecast } from "@/app/actions/forecast";
import { BudgetProgress } from "@/components/budget-progress";
import { CategoryChart } from "@/components/category-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BudgetCategorySectionProps {
  month: number;
  year: number;
  viewUserId: string | null;
  categoryIds: string[] | null;
}

export async function BudgetCategorySection({ month, year, viewUserId, categoryIds }: BudgetCategorySectionProps) {
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
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </>
    );
  }

  // Filter category chart data if categoryIds is provided
  // Convert object to array for CategoryChart component
  const chartData = categoryIds && categoryIds.length > 0
    ? Object.values(stats.byCategory).filter((cat) => 
        categoryIds.includes(cat.categoryId)
      )
    : Object.values(stats.byCategory);

  return (
    <>
      <BudgetProgress 
        budget={budget} 
        spent={stats.total} 
        forecastAmount={forecast?.totalAmount ?? 0} 
      />
      <CategoryChart data={chartData} />
    </>
  );
}

