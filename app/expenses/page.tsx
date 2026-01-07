import { cookies } from "next/headers";
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

// Helper function to resolve viewUserId
function resolveViewUserId(
  viewUserId: string | null | undefined,
  selectedUserId: string | null
): string | null {
  if (viewUserId === "all") return null; // null means all users in server actions
  if (viewUserId === null || viewUserId === undefined) {
    // Default to current user
    return selectedUserId;
  }
  return viewUserId;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const categories = await getCategories();
  const params = await searchParams;

  const expenseType = (params.type as "all" | "regular" | "recurring" | "reminder") || "all";
  const includeProjected = params.includeProjected !== "false";
  const startDate = params.startDate || "";
  const endDate = params.endDate || "";

  // Get viewUserId and selectedUserId from cookies
  const cookieStore = await cookies();
  const viewUserIdCookie = cookieStore.get("viewUserId")?.value;
  const selectedUserId = cookieStore.get("selectedUserId")?.value || null;
  
  // Resolve the actual userId to use for data fetching
  const viewUserId = resolveViewUserId(
    viewUserIdCookie === "all" ? "all" : viewUserIdCookie || null,
    selectedUserId
  );

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
