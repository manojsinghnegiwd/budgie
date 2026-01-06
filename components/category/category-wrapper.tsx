"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-provider";
import { CategoryControls } from "@/components/category/category-controls";
import type { Category } from "@/lib/prisma";

interface CategoryWrapperProps {
  category: Category;
  categories: Category[];
  categoryId: string;
  month: number;
  year: number;
  children: React.ReactNode;
}

export function CategoryWrapper({
  category,
  categories,
  categoryId,
  month,
  year,
  children,
}: CategoryWrapperProps) {
  const { selectedUserId } = useUser();
  const router = useRouter();
  const [categoryBudget, setCategoryBudget] = useState<number | null>(null);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // Fetch category budget for display in controls
  useEffect(() => {
    if (selectedUserId) {
      import("@/app/actions/categories").then(({ getCategoryBudgetForMonth }) => {
        getCategoryBudgetForMonth(selectedUserId, categoryId, month, year).then(setCategoryBudget);
      });
    }
  }, [selectedUserId, categoryId, month, year]);

  if (!selectedUserId) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold">Category Details</h1>
        <p className="text-muted-foreground mt-4">Please select a user from the header.</p>
      </div>
    );
  }

  return (
    <>
      <CategoryControls
        category={category}
        categoryBudget={categoryBudget}
        categories={categories}
        month={month}
        year={year}
        onRefresh={handleRefresh}
      />
      {children}
    </>
  );
}

