"use client";

import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CategoryBudgetProgress } from "@/components/category-budget-progress";
import { getSharedCategoryBudgetsWithSpending, getUserCategoryBudgetsWithSpending } from "@/app/actions/categories";
import { getUsers } from "@/app/actions/users";
import type { User } from "@/lib/prisma";

interface BudgetTabsProps {
  month: number;
  year: number;
}

interface CategoryBudgetData {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  amount: number;
  budgetLimit: number;
  categoryId: string;
  forecastAmount: number;
}

export function BudgetTabs({ month, year }: BudgetTabsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [sharedCategories, setSharedCategories] = useState<CategoryBudgetData[]>([]);
  const [userCategories, setUserCategories] = useState<Record<string, CategoryBudgetData[]>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch users and shared categories in parallel
      const [usersData, sharedData] = await Promise.all([
        getUsers(),
        getSharedCategoryBudgetsWithSpending(month, year),
      ]);

      setUsers(usersData);
      setSharedCategories(sharedData);

      // Fetch user-specific category budgets for each user
      const userCategoriesData: Record<string, CategoryBudgetData[]> = {};
      await Promise.all(
        usersData.map(async (user) => {
          const categories = await getUserCategoryBudgetsWithSpending(user.id, month, year);
          userCategoriesData[user.id] = categories;
        })
      );

      setUserCategories(userCategoriesData);
    } catch (error) {
      console.error("Error loading budget tabs data:", error);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Category Budgets</h2>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if there's any data to show
  const hasSharedCategories = sharedCategories.length > 0;
  const hasUserCategories = Object.values(userCategories).some((cats) => cats.length > 0);

  if (!hasSharedCategories && !hasUserCategories) {
    return null;
  }

  // Convert CategoryBudgetData to format expected by CategoryBudgetProgress
  const formatForProgress = (categories: CategoryBudgetData[]) => {
    const categoryData = categories.map((cat) => ({
      name: cat.name,
      color: cat.color,
      amount: cat.amount,
      budgetLimit: cat.budgetLimit,
      categoryId: cat.categoryId,
    }));

    // Create forecastAmounts map
    const forecastAmounts: Record<string, number> = {};
    categories.forEach((cat) => {
      if (cat.forecastAmount > 0) {
        forecastAmounts[cat.categoryId] = cat.forecastAmount;
      }
    });

    return { categoryData, forecastAmounts };
  };

  // Determine default tab value
  const getDefaultTabValue = () => {
    if (hasSharedCategories) return "shared";
    // Find first user with categories
    const firstUserWithCategories = users.find((user) => userCategories[user.id]?.length > 0);
    return firstUserWithCategories?.id || "";
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Category Budgets</h2>
        <p className="text-sm text-muted-foreground">
          Budget progress for each category this month
        </p>
      </div>
      <Tabs defaultValue={getDefaultTabValue()} className="w-full">
        <TabsList className="mb-4">
          {hasSharedCategories && (
            <TabsTrigger value="shared">Shared</TabsTrigger>
          )}
          {users.map((user) => {
            const hasCategories = userCategories[user.id]?.length > 0;
            if (!hasCategories) return null;
            return (
              <TabsTrigger key={user.id} value={user.id}>
                {user.name}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {hasSharedCategories && (() => {
          const { categoryData, forecastAmounts } = formatForProgress(sharedCategories);
          return (
            <TabsContent value="shared">
              <CategoryBudgetProgress
                categories={categoryData}
                month={month}
                year={year}
                forecastAmounts={forecastAmounts}
                hideHeader={true}
              />
            </TabsContent>
          );
        })()}
        {users.map((user) => {
          const categories = userCategories[user.id];
          if (!categories || categories.length === 0) return null;
          const { categoryData, forecastAmounts } = formatForProgress(categories);
          return (
            <TabsContent key={user.id} value={user.id}>
              <CategoryBudgetProgress
                categories={categoryData}
                month={month}
                year={year}
                forecastAmounts={forecastAmounts}
                hideHeader={true}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

