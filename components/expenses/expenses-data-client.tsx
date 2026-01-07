"use client";

import { Suspense, useEffect, useState } from "react";
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
  userId,
  isAllUsers 
}: ExpensesDataClientProps & { userId: string | null; isAllUsers: boolean }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only show "no user" message if not in "all users" mode AND no userId
    if (!isAllUsers && !userId) {
      setLoading(false);
      setExpenses([]);
      setCategories([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      // Reset data immediately when userId changes to show loading state
      setExpenses([]);
      setCategories([]);
      
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
  }, [userId, isAllUsers, expenseType, includeProjected, startDate, endDate]);

  // Only show "no user" message if not in "all users" mode
  if (!isAllUsers && !userId) {
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
  const { viewUserId, selectedUserId } = useUser();
  
  // Check if "All Users" is selected
  const isAllUsers = viewUserId === "all";
  
  // Resolve viewUserId: "all" -> null (for API), null -> selectedUserId, or specific userId
  const userId = isAllUsers 
    ? null 
    : viewUserId === null 
      ? selectedUserId 
      : viewUserId;
  
  // Create a unique key that includes viewUserId to force re-render when it changes
  const suspenseKey = `${viewUserId || 'null'}-${isAllUsers ? 'all' : userId}-${props.expenseType}-${props.includeProjected}-${props.startDate}-${props.endDate}`;
  
  return (
    <Suspense 
      key={suspenseKey}
      fallback={<ExpensesSkeleton />}
    >
      <ExpensesDataInner {...props} userId={userId} isAllUsers={isAllUsers} />
    </Suspense>
  );
}
