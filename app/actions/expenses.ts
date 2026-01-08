"use server";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertExpenseEmbedding, deleteExpenseEmbedding } from "@/lib/embeddings";

// Cached helper to get shared category IDs (used in multiple places)
const getSharedCategoryIds = cache(async (): Promise<string[]> => {
  const sharedCategories = await prisma.category.findMany({
    where: { isShared: true },
    select: { id: true },
  });
  return sharedCategories.map((c) => c.id);
});

export async function getExpenses(
  userId: string | null,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    type?: "regular" | "recurring" | "reminder";
    includeProjected?: boolean;
  }
) {
  const where: any = {};

  // If userId is null, fetch all expenses (global view)
  // Otherwise, fetch user's expenses + shared category expenses
  if (userId !== null) {
    // Get shared category IDs (cached)
    const sharedCategoryIds = await getSharedCategoryIds();

    where.OR = [
      { userId }, // User's own expenses
      ...(sharedCategoryIds.length > 0
        ? [{ categoryId: { in: sharedCategoryIds } }] // Expenses in shared categories
        : []),
    ];
  }
  // If userId is null, no userId filter - get all expenses

  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate;
    }
  }

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.includeProjected === false) {
    where.isProjected = false;
  }

  return await prisma.expense.findMany({
    where,
    include: {
      category: true,
      user: true,
    },
    orderBy: {
      date: "desc",
    },
  });
}

export const getExpensesByMonth = cache(async (
  userId: string | null,
  month: number,
  year: number,
  includeProjected: boolean = false,
  categoryIds?: string[] | null
) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const where: any = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  // If userId is null, fetch all expenses (global view)
  // Otherwise, fetch user's expenses + shared category expenses
  if (userId !== null) {
    // Get shared category IDs (cached)
    const sharedCategoryIds = await getSharedCategoryIds();

    where.OR = [
      { userId }, // User's own expenses
      ...(sharedCategoryIds.length > 0
        ? [{ categoryId: { in: sharedCategoryIds } }] // Expenses in shared categories
        : []),
    ];
  }
  // If userId is null, no userId filter - get all expenses

  if (categoryIds && categoryIds.length > 0) {
    where.categoryId = { in: categoryIds };
  }

  if (!includeProjected) {
    where.isProjected = false;
  }

  return await prisma.expense.findMany({
    where,
    include: {
      category: true,
      user: true,
    },
    orderBy: {
      date: "desc",
    },
  });
});

export const getExpenseStats = cache(async (
  userId: string | null,
  month: number,
  year: number,
  includeProjected: boolean = false,
  categoryIds?: string[] | null
) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const where: any = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  // If userId is null, fetch all expenses (global view)
  // Otherwise, fetch user's expenses + shared category expenses
  if (userId !== null) {
    // Get shared category IDs (cached)
    const sharedCategoryIds = await getSharedCategoryIds();

    where.OR = [
      { userId }, // User's own expenses
      ...(sharedCategoryIds.length > 0
        ? [{ categoryId: { in: sharedCategoryIds } }] // Expenses in shared categories
        : []),
    ];
  }
  // If userId is null, no userId filter - get all expenses

  if (categoryIds && categoryIds.length > 0) {
    where.categoryId = { in: categoryIds };
  }

  if (!includeProjected) {
    where.isProjected = false;
    where.isPaid = true; // Only count paid expenses as "spent"
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      category: true,
      user: true,
    },
  });

  const total = expenses.reduce((sum: number, expense: typeof expenses[0]) => sum + expense.amount, 0);

  const byCategory: Record<string, { name: string; color: string; amount: number; categoryId: string }> = {};
  for (const expense of expenses) {
    const categoryName = expense.category.name;
    if (!byCategory[categoryName]) {
      byCategory[categoryName] = {
        name: categoryName,
        color: expense.category.color,
        amount: 0,
        categoryId: expense.category.id,
      };
    }
    byCategory[categoryName].amount += expense.amount;
  }

  // Get budget limits for each category (month-aware)
  // Batch fetch all budget data to avoid N+1 queries
  const expenseCategoryIds = Object.values(byCategory).map(cat => cat.categoryId);
  
  // Batch fetch all required data in parallel
  const [allCategories, allMonthlyBudgets, allDefaultBudgets, allUsers] = await Promise.all([
    // Fetch all categories to check isShared and budgetLimit
    prisma.category.findMany({
      where: { id: { in: expenseCategoryIds } },
      select: { id: true, budgetLimit: true, isShared: true },
    }),
    // Fetch all monthly budgets for this month/year
    userId === null
      ? prisma.userCategoryBudget.findMany({
          where: {
            categoryId: { in: expenseCategoryIds },
            month,
            year,
          },
        })
      : prisma.userCategoryBudget.findMany({
          where: {
            userId,
            categoryId: { in: expenseCategoryIds },
            month,
            year,
          },
        }),
    // Fetch all default budgets
    userId === null
      ? prisma.userCategoryDefaultBudget.findMany({
          where: { categoryId: { in: expenseCategoryIds } },
        })
      : prisma.userCategoryDefaultBudget.findMany({
          where: {
            userId,
            categoryId: { in: expenseCategoryIds },
          },
        }),
    // Fetch all users (needed for global view aggregation)
    userId === null ? prisma.user.findMany({ select: { id: true } }) : Promise.resolve([]),
  ]);

  // Build lookup maps for O(1) access
  const categoryMap = new Map(allCategories.map(cat => [cat.id, cat]));
  const monthlyBudgetMap = new Map(
    allMonthlyBudgets.map(budget => [`${budget.userId}-${budget.categoryId}`, budget.limit])
  );
  const defaultBudgetMap = new Map(
    allDefaultBudgets.map(budget => [`${budget.userId}-${budget.categoryId}`, budget.limit])
  );

  // Helper function to get budget for a specific user and category
  const getBudgetForUserAndCategory = (userId: string, categoryId: string): number | null => {
    // Check monthly budget first
    const monthlyKey = `${userId}-${categoryId}`;
    if (monthlyBudgetMap.has(monthlyKey)) {
      return monthlyBudgetMap.get(monthlyKey)!;
    }
    
    // Check default budget
    if (defaultBudgetMap.has(monthlyKey)) {
      return defaultBudgetMap.get(monthlyKey)!;
    }
    
    // Check shared category budgetLimit
    const category = categoryMap.get(categoryId);
    if (category?.isShared && category.budgetLimit !== null) {
      return category.budgetLimit;
    }
    
    return null;
  };

  // Calculate budget limits for each category
  const byCategoryWithBudgets = Object.values(byCategory).map((cat) => {
    let budgetLimit: number | null = null;
    
    if (userId === null) {
      // Global view: Check if category has global limit, otherwise aggregate user budgets
      const category = categoryMap.get(cat.categoryId);
      
      if (category?.isShared && category.budgetLimit !== null) {
        // Shared category with global limit
        budgetLimit = category.budgetLimit;
      } else {
        // Personal category: aggregate all user budgets for this category
        const userBudgets = allUsers
          .map(user => getBudgetForUserAndCategory(user.id, cat.categoryId))
          .filter((b): b is number => b !== null);
        budgetLimit = userBudgets.length > 0 ? userBudgets.reduce((sum, b) => sum + b, 0) : null;
      }
    } else {
      // User-specific view: use lookup maps
      budgetLimit = getBudgetForUserAndCategory(userId, cat.categoryId);
    }
    
    return {
      ...cat,
      budgetLimit,
    };
  });

  return {
    total,
    byCategory: byCategoryWithBudgets,
    count: expenses.length,
  };
});

export async function createExpense(
  userId: string,
  data: {
    description: string;
    additionalDescription?: string;
    amount: number;
    date: Date;
    categoryId: string;
  }
) {
  const expense = await prisma.expense.create({
    data: {
      ...data,
      userId,
      isPaid: true, // Regular expenses are paid by default
    },
    include: {
      category: true,
    },
  });

  // Trigger embedding asynchronously (don't block the response)
  upsertExpenseEmbedding({
    id: expense.id,
    description: expense.description,
    additionalDescription: expense.additionalDescription,
    userId: expense.userId,
    categoryId: expense.categoryId,
    date: expense.date,
    amount: expense.amount,
  }).catch((error) => {
    console.error("Error creating embedding for expense:", error);
  });

  revalidatePath("/");
  revalidatePath("/expenses");

  return expense;
}

export async function updateExpense(
  id: string,
  data: {
    description?: string;
    additionalDescription?: string;
    amount?: number;
    date?: Date;
    categoryId?: string;
  }
) {
  const expense = await prisma.expense.update({
    where: { id },
    data,
    include: {
      category: true,
    },
  });

  // Re-generate embedding if description or additionalDescription changed
  if (data.description !== undefined || data.additionalDescription !== undefined) {
    upsertExpenseEmbedding({
      id: expense.id,
      description: expense.description,
      additionalDescription: expense.additionalDescription,
      userId: expense.userId,
      categoryId: expense.categoryId,
      date: expense.date,
      amount: expense.amount,
    }).catch((error) => {
      console.error("Error updating embedding for expense:", error);
    });
  }

  revalidatePath("/");
  revalidatePath("/expenses");

  return expense;
}

export async function deleteExpense(id: string) {
  await prisma.expense.delete({
    where: { id },
  });

  // Delete embedding from Pinecone
  deleteExpenseEmbedding(id).catch((error) => {
    console.error("Error deleting embedding for expense:", error);
  });

  revalidatePath("/");
  revalidatePath("/expenses");
}

export async function markExpenseAsPaid(id: string, isPaid: boolean) {
  const expense = await prisma.expense.update({
    where: { id },
    data: {
      isPaid,
      // When marking as paid, it's no longer a projection
      ...(isPaid ? { isProjected: false } : {}),
    },
    include: {
      category: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/expenses");

  return expense;
}

function calculateNextDueDate(
  currentDate: Date,
  frequency: "daily" | "weekly" | "monthly" | "yearly",
  dayOfMonth?: number
): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      if (dayOfMonth) {
        next.setMonth(next.getMonth() + 1);
        const daysInMonth = new Date(
          next.getFullYear(),
          next.getMonth() + 1,
          0
        ).getDate();
        next.setDate(Math.min(dayOfMonth, daysInMonth));
      } else {
        next.setMonth(next.getMonth() + 1);
      }
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      if (dayOfMonth) {
        const daysInMonth = new Date(
          next.getFullYear(),
          next.getMonth() + 1,
          0
        ).getDate();
        next.setDate(Math.min(dayOfMonth, daysInMonth));
      }
      break;
  }

  return next;
}

function calculateAllOccurrenceDates(
  startDate: Date,
  endDate: Date,
  frequency: "daily" | "weekly" | "monthly" | "yearly",
  dayOfMonth?: number
): Date[] {
  const occurrences: Date[] = [];
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (currentDate <= end) {
    occurrences.push(new Date(currentDate));
    currentDate = calculateNextDueDate(currentDate, frequency, dayOfMonth);
  }

  return occurrences;
}

export async function createRecurringExpense(
  userId: string,
  data: {
    description: string;
    additionalDescription?: string;
    amount: number;
    categoryId: string;
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    dayOfMonth?: number;
    startDate: Date;
    endDate: Date;
  }
) {
  // Calculate all occurrence dates between start and end
  const occurrenceDates = calculateAllOccurrenceDates(
    data.startDate,
    data.endDate,
    data.frequency,
    data.dayOfMonth
  );

  if (occurrenceDates.length === 0) {
    throw new Error("No occurrences found between start and end date");
  }

  // Create all expense entries upfront
  const expenses = await prisma.$transaction(
    occurrenceDates.map((date) =>
      prisma.expense.create({
        data: {
          userId,
          description: data.description,
          additionalDescription: data.additionalDescription,
          amount: data.amount,
          date: date,
          categoryId: data.categoryId,
          type: "recurring",
          isProjected: true,
          isPaid: false, // Recurring expenses are unpaid by default
          recurringFrequency: data.frequency,
          dayOfMonth: data.dayOfMonth || null,
          endDate: data.endDate,
          isActive: true,
        },
        include: {
          category: true,
        },
      })
    )
  );

  // Trigger embeddings for all created expenses asynchronously
  Promise.all(
    expenses.map((expense) =>
      upsertExpenseEmbedding({
        id: expense.id,
        description: expense.description,
        additionalDescription: expense.additionalDescription,
        userId: expense.userId,
        categoryId: expense.categoryId,
        date: expense.date,
        amount: expense.amount,
      })
    )
  ).catch((error) => {
    console.error("Error creating embeddings for recurring expenses:", error);
  });

  revalidatePath("/");
  revalidatePath("/expenses");

  return expenses;
}

export async function createReminderExpense(
  userId: string,
  data: {
    description: string;
    additionalDescription?: string;
    amount: number;
    date: Date;
    categoryId: string;
  }
) {
  const expense = await prisma.expense.create({
    data: {
      userId,
      description: data.description,
      additionalDescription: data.additionalDescription,
      amount: data.amount,
      date: data.date,
      categoryId: data.categoryId,
      type: "reminder",
      isProjected: true,
      isPaid: false, // Reminder expenses are unpaid by default
      isCompleted: false,
    },
    include: {
      category: true,
    },
  });

  // Trigger embedding asynchronously
  upsertExpenseEmbedding({
    id: expense.id,
    description: expense.description,
    additionalDescription: expense.additionalDescription,
    userId: expense.userId,
    categoryId: expense.categoryId,
    date: expense.date,
    amount: expense.amount,
  }).catch((error) => {
    console.error("Error creating embedding for reminder:", error);
  });

  revalidatePath("/");
  revalidatePath("/expenses");

  return expense;
}

export async function completeReminderExpense(id: string) {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  if (!expense || expense.type !== "reminder") {
    throw new Error("Expense not found or is not a reminder");
  }

  await prisma.expense.update({
    where: { id },
    data: {
      isProjected: false,
      isCompleted: true,
      isPaid: false, // Keep reminders as unpaid
    },
  });

  revalidatePath("/");
  revalidatePath("/expenses");
}

