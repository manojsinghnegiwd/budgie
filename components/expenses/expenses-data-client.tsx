"use client";

import { Suspense, useEffect, useState, use } from "react";
import { useUser } from "@/components/user-provider";
import { getExpenses } from "@/app/actions/expenses";
import { getCategories } from "@/app/actions/categories";
import { ExpensesTable } from "@/components/expenses-table";
import { ExpensesSkeleton } from "@/components/dashboard/section-skeletons";

interface ExpensesDataClientProps {
  expenseType: "all" | "regular" | "recurring" | "reminder";
  includeProjected: boolean;
  startDate?: string;
  endDate?: string;
}

// This component fetches data using Server Actions from the client
// This allows us to use userId from context while still using Server Actions
function ExpensesDataInner({ 
  expenseType, 
  includeProjected, 
  startDate, 
  endDate,
  userId 
}: ExpensesDataClientProps & { userId: string | null }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [expensesData, categoriesData] = await Promise.all([
          getExpenses(userId, {
            type: expenseType === "all" ? undefined : expenseType,
            includeProjected: includeProjected ? undefined : false,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
          }),
          getCategories(),
        ]);
        setExpenses(expensesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, expenseType, includeProjected, startDate, endDate]);

  if (!userId) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-muted-foreground mt-4">Please select a user from the header.</p>
      </div>
    );
  }

  if (loading) {
    return <ExpensesSkeleton />;
  }

  return <ExpensesTable expenses={expenses} categories={categories} />;
}

export function ExpensesDataClient(props: ExpensesDataClientProps) {
  const { selectedUserId } = useUser();
  
  return (
    <Suspense 
      key={`${selectedUserId}-${props.expenseType}-${props.includeProjected}-${props.startDate}-${props.endDate}`} 
      fallback={<ExpensesSkeleton />}
    >
      <ExpensesDataInner {...props} userId={selectedUserId} />
    </Suspense>
  );
}
