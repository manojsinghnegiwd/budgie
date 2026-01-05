"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getMonthForecast } from "./forecast";

export async function getCategories() {
  return await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function createCategory(data: {
  name: string;
  color: string;
  icon?: string;
  budgetLimit?: number | null;
  isShared?: boolean;
}) {
  const category = await prisma.category.create({
    data: {
      name: data.name,
      color: data.color,
      icon: data.icon,
      budgetLimit: data.isShared ? (data.budgetLimit ?? null) : null, // Only set if shared
      isShared: data.isShared ?? false,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/expenses");
  revalidatePath("/");

  return category;
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    color?: string;
    icon?: string;
    budgetLimit?: number | null;
    isShared?: boolean;
  }
) {
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.budgetLimit !== undefined && { budgetLimit: data.budgetLimit }),
      ...(data.isShared !== undefined && { isShared: data.isShared }),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/expenses");
  revalidatePath("/");

  return category;
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({
    where: { id },
  });

  revalidatePath("/settings");
  revalidatePath("/expenses");
}

export async function updateCategoryBudget(
  categoryId: string,
  data: {
    budgetLimit?: number | null;
    isShared?: boolean;
  }
) {
  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      budgetLimit: data.budgetLimit,
      ...(data.isShared !== undefined && { isShared: data.isShared }),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");

  return category;
}

export async function getCategoryBudgetForMonth(
  userId: string,
  categoryId: string,
  month: number,
  year: number
): Promise<number | null> {
  // First check if there's a specific monthly record
  const monthlyBudget = await prisma.userCategoryBudget.findUnique({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId,
        month,
        year,
      },
    },
  });

  if (monthlyBudget) {
    return monthlyBudget.limit;
  }

  // If no monthly record, check for user's default for this category
  const defaultBudget = await prisma.userCategoryDefaultBudget.findUnique({
    where: {
      userId_categoryId: {
        userId,
        categoryId,
      },
    },
  });

  if (defaultBudget) {
    return defaultBudget.limit;
  }

  // If no user default, fall back to global category limit (only for shared categories)
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { budgetLimit: true, isShared: true },
  });

  if (category?.isShared && category.budgetLimit !== null) {
    return category.budgetLimit;
  }

  return null;
}

export async function getUserCategoryBudget(
  userId: string,
  categoryId: string
): Promise<number | null> {
  // Use current month/year for backward compatibility
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  return getCategoryBudgetForMonth(userId, categoryId, month, year);
}

export async function setUserCategoryBudget(
  userId: string,
  categoryId: string,
  limit: number
) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Update/create budget record for current month
  await prisma.userCategoryBudget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId,
        month,
        year,
      },
    },
    update: {
      limit,
    },
    create: {
      userId,
      categoryId,
      month,
      year,
      limit,
    },
  });

  // Also update user's default budget for this category (for future months)
  await prisma.userCategoryDefaultBudget.upsert({
    where: {
      userId_categoryId: {
        userId,
        categoryId,
      },
    },
    update: {
      limit,
    },
    create: {
      userId,
      categoryId,
      limit,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath(`/category/${categoryId}`);
}

export async function deleteUserCategoryBudget(
  userId: string,
  categoryId: string
) {
  // Delete all monthly records for this user/category
  await prisma.userCategoryBudget.deleteMany({
    where: {
      userId,
      categoryId,
    },
  });

  // Delete the default budget
  await prisma.userCategoryDefaultBudget.deleteMany({
    where: {
      userId,
      categoryId,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function getCategoriesWithBudgets(userId: string) {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      userBudgets: {
        where: { userId },
      },
    },
  });

  return categories.map((category) => {
    let effectiveLimit: number | null = null;

    if (category.isShared) {
      effectiveLimit = category.budgetLimit;
    } else {
      // Check for user-specific budget
      if (category.userBudgets.length > 0) {
        effectiveLimit = category.userBudgets[0].limit;
      }
    }

    return {
      ...category,
      effectiveLimit,
    };
  });
}

export async function getAllCategoriesWithGlobalBudgets(
  month: number,
  year: number
) {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const allUsers = await prisma.user.findMany({ select: { id: true } });

  return await Promise.all(
    categories.map(async (category) => {
      let budgetLimit: number | null = null;

      if (category.isShared && category.budgetLimit !== null) {
        // Shared category with global limit
        budgetLimit = category.budgetLimit;
      } else {
        // Personal category: aggregate all user budgets for this category
        const userBudgets = await Promise.all(
          allUsers.map(async (user) =>
            getCategoryBudgetForMonth(user.id, category.id, month, year)
          )
        );
        // Sum all non-null budgets
        const validBudgets = userBudgets.filter((b): b is number => b !== null);
        budgetLimit = validBudgets.length > 0 ? validBudgets.reduce((sum, b) => sum + b, 0) : null;
      }

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        budgetLimit,
      };
    })
  );
}

export async function getSharedCategoryBudgetsWithSpending(
  month: number,
  year: number
): Promise<Array<{ id: string; name: string; color: string; icon: string | null; amount: number; budgetLimit: number; categoryId: string; forecastAmount: number }>> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Get all shared categories with budget limits
  const sharedCategories = await prisma.category.findMany({
    where: {
      isShared: true,
      budgetLimit: {
        not: null,
        gt: 0,
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Calculate spending and forecast for each shared category (across all users)
  const categoriesWithSpending = await Promise.all(
    sharedCategories.map(async (category) => {
      // Get all expenses in this category for the month (across all users)
      const expenses = await prisma.expense.findMany({
        where: {
          categoryId: category.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
          isProjected: false, // Only count actual expenses, not projected
        },
      });

      const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Get forecast amount for this category (global view, null userId)
      const forecast = await getMonthForecast(null, month, year, category.id);

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        amount: totalSpending,
        budgetLimit: category.budgetLimit!,
        categoryId: category.id,
        forecastAmount: forecast.totalAmount,
      };
    })
  );

  return categoriesWithSpending;
}

export async function getUserCategoryBudgetsWithSpending(
  userId: string,
  month: number,
  year: number
): Promise<Array<{ id: string; name: string; color: string; icon: string | null; amount: number; budgetLimit: number; categoryId: string; forecastAmount: number }>> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Get all categories where the user has a budget set
  const userBudgets = await prisma.userCategoryBudget.findMany({
    where: {
      userId,
      month,
      year,
    },
    include: {
      category: true,
    },
  });

  // Also get default budgets (for categories without monthly budgets)
  const defaultBudgets = await prisma.userCategoryDefaultBudget.findMany({
    where: {
      userId,
    },
    include: {
      category: true,
    },
  });

  // Create a map of categoryId -> budget limit
  const budgetMap = new Map<string, number>();
  
  // Add monthly budgets
  userBudgets.forEach((budget) => {
    budgetMap.set(budget.categoryId, budget.limit);
  });

  // Add default budgets for categories not in monthly budgets
  defaultBudgets.forEach((budget) => {
    if (!budgetMap.has(budget.categoryId)) {
      budgetMap.set(budget.categoryId, budget.limit);
    }
  });

  // Calculate spending and forecast for each category where user has a budget
  const categoriesWithSpending = await Promise.all(
    Array.from(budgetMap.entries()).map(async ([categoryId, budgetLimit]) => {
      // Get the category details
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return null;
      }

      // Get expenses for this user in this category for the month
      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          categoryId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          isProjected: false, // Only count actual expenses, not projected
        },
      });

      const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Get forecast amount for this user and category
      const forecast = await getMonthForecast(userId, month, year, categoryId);

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        amount: totalSpending,
        budgetLimit,
        categoryId: category.id,
        forecastAmount: forecast.totalAmount,
      };
    })
  );

  // Filter out null values and return
  return categoriesWithSpending.filter((cat): cat is NonNullable<typeof cat> => cat !== null);
}

