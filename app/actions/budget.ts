"use server";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCategoryBudgetForMonth } from "./categories";
import { getExpenseStats } from "./expenses";
import { getMonthForecast } from "./forecast";
import { invalidateInsightCache } from "./insights";

export async function getCurrentBudget() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return getBudgetForMonth(month, year);
}

export const getBudgetForMonth = cache(async (month: number, year: number) => {
  const budget = await prisma.globalBudget.findUnique({
    where: {
      month_year: {
        month,
        year,
      },
    },
  });

  // If budget record exists, return it (preserves historical data)
  if (budget) {
    return budget;
  }

  // If no budget record exists, return default global budget from settings
  const settings = await prisma.settings.findFirst();

  // Return a virtual budget object using the default global budget
  return {
    id: "", // Virtual budget has no ID
    monthlyLimit: settings?.defaultGlobalBudgetLimit || 0,
    month,
    year,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});

export async function updateBudgetLimit(limit: number) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Update/create global budget record for current month
  await prisma.globalBudget.upsert({
    where: {
      month_year: {
        month,
        year,
      },
    },
    update: {
      monthlyLimit: limit,
    },
    create: {
      month,
      year,
      monthlyLimit: limit,
    },
  });

  // Also update default global budget in settings for future months
  const settings = await prisma.settings.findFirst();
  if (settings) {
    await prisma.settings.update({
      where: { id: settings.id },
      data: { defaultGlobalBudgetLimit: limit },
    });
  } else {
    // Create settings if it doesn't exist
    await prisma.settings.create({
      data: {
        defaultGlobalBudgetLimit: limit,
      },
    });
  }

  // Invalidate insight cache for current month
  await invalidateInsightCache(month, year);

  revalidatePath("/");
  revalidatePath("/settings");
}

/**
 * Get the sum of budgets for selected categories.
 * If categoryIds is null or empty, returns null (use global budget instead).
 * If categoryIds is provided, sums up the budgets for those categories.
 */
export async function getCategoryBudgetSum(
  userId: string | null,
  categoryIds: string[] | null,
  month: number,
  year: number
): Promise<number | null> {
  // If no categories selected or empty array, return null to use global budget
  if (!categoryIds || categoryIds.length === 0) {
    return null;
  }

  // Get all users if userId is null (global view)
  const allUsers = userId === null 
    ? await prisma.user.findMany({ select: { id: true } })
    : [{ id: userId }];

  let totalBudget = 0;
  let hasAnyBudget = false;

  // For each category, get the budget and sum them up
  for (const categoryId of categoryIds) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, budgetLimit: true, isShared: true },
    });

    if (!category) continue;

    if (category.isShared && category.budgetLimit !== null) {
      // Shared category with global limit - add it once
      totalBudget += category.budgetLimit;
      hasAnyBudget = true;
    } else {
      // Personal category - aggregate budgets across all users
      for (const user of allUsers) {
        const budget = await getCategoryBudgetForMonth(
          user.id,
          categoryId,
          month,
          year
        );
        if (budget !== null) {
          totalBudget += budget;
          hasAnyBudget = true;
        }
      }
    }
  }

  return hasAnyBudget ? totalBudget : null;
}

/**
 * Calculate carryover amount from previous month's overspending
 * For future months, calculates cumulative projected carryover
 * Returns the amount by which spending exceeded the budget
 */
export async function getCarryoverAmount(
  month: number, 
  year: number, 
  userId: string | null,
  categoryIds: string[] | null = null
): Promise<number> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // Check if target month is in the future
  const targetDate = new Date(year, month - 1, 1);
  const currentDate = new Date(currentYear, currentMonth - 1, 1);
  const isFutureMonth = targetDate > currentDate;
  
  if (!isFutureMonth) {
    // For current or past months, use the original logic (previous month's actual spending)
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    
    const [prevBudget, prevStats] = await Promise.all([
      getBudgetForMonth(prevMonth, prevYear),
      getExpenseStats(userId, prevMonth, prevYear, false, categoryIds),
    ]);
    
    let budgetLimit = prevBudget.monthlyLimit;
    if (categoryIds && categoryIds.length > 0) {
      const categoryBudgetSum = await getCategoryBudgetSum(userId, categoryIds, prevMonth, prevYear);
      if (categoryBudgetSum !== null) {
        budgetLimit = categoryBudgetSum;
      }
    }
    
    const overspent = prevStats.total - budgetLimit;
    return Math.max(0, overspent);
  }
  
  // For future months, calculate cumulative carryover starting from current month
  // First, get any existing carryover that the current month has from the previous month
  const prevMonthFromCurrent = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYearFromCurrent = currentMonth === 1 ? currentYear - 1 : currentYear;
  
  const [prevBudget, prevStats] = await Promise.all([
    getBudgetForMonth(prevMonthFromCurrent, prevYearFromCurrent),
    getExpenseStats(userId, prevMonthFromCurrent, prevYearFromCurrent, false, categoryIds),
  ]);
  
  let prevBudgetLimit = prevBudget.monthlyLimit;
  if (categoryIds && categoryIds.length > 0) {
    const categoryBudgetSum = await getCategoryBudgetSum(userId, categoryIds, prevMonthFromCurrent, prevYearFromCurrent);
    if (categoryBudgetSum !== null) {
      prevBudgetLimit = categoryBudgetSum;
    }
  }
  
  // Initialize carryover with what the current month already carries over from previous month
  let cumulativeCarryover = Math.max(0, prevStats.total - prevBudgetLimit);
  
  // Calculate for each month from current to target (exclusive)
  let iterMonth = currentMonth;
  let iterYear = currentYear;
  
  while (iterYear < year || (iterYear === year && iterMonth < month)) {
    // Get budget for this month
    const monthBudget = await getBudgetForMonth(iterMonth, iterYear);
    let budgetLimit = monthBudget.monthlyLimit;
    
    if (categoryIds && categoryIds.length > 0) {
      const categoryBudgetSum = await getCategoryBudgetSum(userId, categoryIds, iterMonth, iterYear);
      if (categoryBudgetSum !== null) {
        budgetLimit = categoryBudgetSum;
      }
    }
    
    // Get actual spending + forecasted spending for this month
    const [stats, forecast] = await Promise.all([
      getExpenseStats(userId, iterMonth, iterYear, false, categoryIds),
      getMonthForecast(userId, iterMonth, iterYear, categoryIds),
    ]);
    
    const totalProjectedSpending = stats.total + forecast.totalAmount;
    
    // Effective budget = budget - any carryover from previous months
    const effectiveBudget = budgetLimit - cumulativeCarryover;
    
    // Calculate overspending for this month
    const monthOverspend = totalProjectedSpending - effectiveBudget;
    
    if (monthOverspend > 0) {
      // This month is projected to overspend
      cumulativeCarryover = monthOverspend;
    } else {
      // This month absorbs some/all of the carryover
      // Reset carryover since we're under budget
      cumulativeCarryover = 0;
    }
    
    // Move to next month
    if (iterMonth === 12) {
      iterMonth = 1;
      iterYear++;
    } else {
      iterMonth++;
    }
  }
  
  return cumulativeCarryover;
}

