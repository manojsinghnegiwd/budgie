import { getCategories } from "@/app/actions/categories";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";
import { ExpensesControlsClient } from "@/components/expenses/expenses-controls-client";
import { ExpensesDataClient } from "@/components/expenses/expenses-data-client";

interface ExpensesPageProps {
  searchParams: Promise<{
    type?: string;
    includeProjected?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const categories = await getCategories();
  const params = await searchParams;

  const expenseType = (params.type as "all" | "regular" | "recurring" | "reminder") || "all";
  const includeProjected = params.includeProjected !== "false";
  const startDate = params.startDate || "";
  const endDate = params.endDate || "";

  return (
    <DashboardWrapper>
      <ExpensesControlsClient
        categories={categories}
        initialExpenseType={expenseType}
        initialIncludeProjected={includeProjected}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
      <ExpensesDataClient
        expenseType={expenseType}
        includeProjected={includeProjected}
        startDate={startDate || undefined}
        endDate={endDate || undefined}
      />
    </DashboardWrapper>
  );
}
