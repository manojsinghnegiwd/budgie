"use server";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCategoryBudgetForMonth } from "./categories";

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

