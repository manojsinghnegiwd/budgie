import { getExpensesByMonth } from "@/app/actions/expenses";
import { getCategories } from "@/app/actions/categories";
import { ExpensesTable } from "@/components/expenses-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpensesSectionProps {
  month: number;
  year: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export async function ExpensesSection({ month, year }: ExpensesSectionProps) {
  const [expenses, categories] = await Promise.all([
    getExpensesByMonth(null, month, year, true),
    getCategories(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Expenses</CardTitle>
        <CardDescription>All expenses for {monthNames[month - 1]} {year}</CardDescription>
      </CardHeader>
      <CardContent>
        <ExpensesTable expenses={expenses} categories={categories} />
      </CardContent>
    </Card>
  );
}

