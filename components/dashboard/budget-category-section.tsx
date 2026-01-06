import { getBudgetForMonth } from "@/app/actions/budget";
import { getExpenseStats } from "@/app/actions/expenses";
import { getMonthForecast } from "@/app/actions/forecast";
import { BudgetProgress } from "@/components/budget-progress";
import { CategoryChart } from "@/components/category-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BudgetCategorySectionProps {
  month: number;
  year: number;
}

export async function BudgetCategorySection({ month, year }: BudgetCategorySectionProps) {
  const [budget, stats, forecast] = await Promise.all([
    getBudgetForMonth(month, year),
    getExpenseStats(null, month, year, false),
    getMonthForecast(null, month, year),
  ]);

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

  return (
    <>
      <BudgetProgress 
        budget={budget} 
        spent={stats.total} 
        forecastAmount={forecast?.totalAmount ?? 0} 
      />
      <CategoryChart data={stats.byCategory} />
    </>
  );
}

