import { getExpensesByMonth } from "@/app/actions/expenses";
import { SpendingTrends } from "@/components/spending-trends";
import { MonthComparison } from "@/components/month-comparison";

interface CategoryTrendsSectionProps {
  userId: string;
  categoryId: string;
  month: number;
  year: number;
}

export async function CategoryTrendsSection({ userId, categoryId, month, year }: CategoryTrendsSectionProps) {
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;

  const [currentExpenses, previousExpenses] = await Promise.all([
    getExpensesByMonth(userId, month, year, true, [categoryId]),
    getExpensesByMonth(userId, previousMonth, previousYear, false, [categoryId]),
  ]);

  return (
    <>
      <SpendingTrends expenses={currentExpenses} month={month} year={year} />
      <MonthComparison
        currentExpenses={currentExpenses}
        previousExpenses={previousExpenses}
        currentMonth={month}
        currentYear={year}
      />
    </>
  );
}

