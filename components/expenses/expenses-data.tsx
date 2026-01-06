import { getExpenses } from "@/app/actions/expenses";
import { getCategories } from "@/app/actions/categories";
import { ExpensesTable } from "@/components/expenses-table";

interface ExpensesDataProps {
  userId: string | null;
  expenseType: "all" | "regular" | "recurring" | "reminder";
  includeProjected: boolean;
  startDate?: string;
  endDate?: string;
}

export async function ExpensesData({ userId, expenseType, includeProjected, startDate, endDate }: ExpensesDataProps) {
  if (!userId) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-muted-foreground mt-4">Please select a user from the header.</p>
      </div>
    );
  }

  const [expenses, categories] = await Promise.all([
    getExpenses(userId, {
      type: expenseType === "all" ? undefined : expenseType,
      includeProjected: includeProjected ? undefined : false,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }),
    getCategories(),
  ]);

  return <ExpensesTable expenses={expenses} categories={categories} />;
}
