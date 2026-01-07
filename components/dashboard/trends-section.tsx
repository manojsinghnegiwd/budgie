import { getExpensesByMonth } from "@/app/actions/expenses";
import { SpendingTrends } from "@/components/spending-trends";
import { MonthComparison } from "@/components/month-comparison";

interface TrendsSectionProps {
  month: number;
  year: number;
  viewUserId: string | null;
  categoryIds: string[] | null;
}

export async function TrendsSection({ month, year, viewUserId, categoryIds }: TrendsSectionProps) {
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;

  const [currentExpenses, previousExpenses] = await Promise.all([
    getExpensesByMonth(viewUserId, month, year, true, categoryIds),
    getExpensesByMonth(viewUserId, previousMonth, previousYear, false, categoryIds),
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
