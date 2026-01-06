import { getExpensesByMonth } from "@/app/actions/expenses";
import { SpendingTrends } from "@/components/spending-trends";
import { MonthComparison } from "@/components/month-comparison";

interface TrendsSectionProps {
  month: number;
  year: number;
}

export async function TrendsSection({ month, year }: TrendsSectionProps) {
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;

  const [currentExpenses, previousExpenses] = await Promise.all([
    getExpensesByMonth(null, month, year, true),
    getExpensesByMonth(null, previousMonth, previousYear, false),
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

