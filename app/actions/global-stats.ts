"use server";

import { prisma } from "@/lib/prisma";

export async function getGlobalStats(month?: number, year?: number) {
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  // Get all users
  const users = await prisma.user.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // Get shared category IDs
  const sharedCategories = await prisma.category.findMany({
    where: { isShared: true },
    select: { id: true },
  });
  const sharedCategoryIds = sharedCategories.map((c) => c.id);

  // Get expenses for all users in the month
  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: true,
      category: true,
    },
  });

  // Get global budget for the month
  const globalBudget = await prisma.globalBudget.findUnique({
    where: {
      month_year: {
        month: targetMonth,
        year: targetYear,
      },
    },
  });

  // Get default global budget from settings if no monthly record exists
  const settings = await prisma.settings.findFirst();
  const overallBudgetLimit = globalBudget?.monthlyLimit ?? settings?.defaultGlobalBudgetLimit ?? 0;

  // Calculate stats per user
  const userStats = users.map((user) => {
    // Include user's own expenses + expenses in shared categories
    const userExpenses = expenses.filter(
      (e) =>
        e.userId === user.id ||
        (sharedCategoryIds.includes(e.categoryId) && e.category.isShared)
    );

    const total = userExpenses.reduce((sum, e) => sum + e.amount, 0);
    // Use global budget for all users
    const budgetLimit = overallBudgetLimit;

    // Calculate by category
    const byCategory: Record<
      string,
      { name: string; color: string; amount: number }
    > = {};
    for (const expense of userExpenses) {
      const categoryName = expense.category.name;
      if (!byCategory[categoryName]) {
        byCategory[categoryName] = {
          name: categoryName,
          color: expense.category.color,
          amount: 0,
        };
      }
      byCategory[categoryName].amount += expense.amount;
    }

    return {
      userId: user.id,
      userName: user.name,
      total,
      budgetLimit,
      spent: total,
      remaining: budgetLimit - total,
      count: userExpenses.length,
      byCategory: Object.values(byCategory),
    };
  });

  // Calculate overall stats
  const overallTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  // Use global budget for overall stats
  const overallBudget = overallBudgetLimit;
  const overallCount = expenses.length;

  // Overall by category
  const overallByCategory: Record<
    string,
    { name: string; color: string; amount: number }
  > = {};
  for (const expense of expenses) {
    const categoryName = expense.category.name;
    if (!overallByCategory[categoryName]) {
      overallByCategory[categoryName] = {
        name: categoryName,
        color: expense.category.color,
        amount: 0,
      };
    }
    overallByCategory[categoryName].amount += expense.amount;
  }

  return {
    month: targetMonth,
    year: targetYear,
    overall: {
      total: overallTotal,
      budget: overallBudget,
      spent: overallTotal,
      remaining: overallBudget - overallTotal,
      count: overallCount,
      byCategory: Object.values(overallByCategory),
    },
    byUser: userStats,
  };
}

export async function getAllUsersStats() {
  const users = await prisma.user.findMany({
    include: {
      expenses: {
        include: {
          category: true,
        },
      },
      budgets: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return users.map((user) => {
    const totalExpenses = user.expenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );
    const totalBudget = user.budgets.reduce(
      (sum, b) => sum + b.monthlyLimit,
      0
    );

    return {
      id: user.id,
      name: user.name,
      totalExpenses,
      totalBudget,
      expenseCount: user.expenses.length,
    };
  });
}

