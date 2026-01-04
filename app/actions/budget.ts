"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCurrentBudget(userId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return getBudgetForMonth(userId, month, year);
}

export async function getBudgetForMonth(
  userId: string,
  month: number,
  year: number
) {
  const budget = await prisma.budget.findUnique({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
  });

  // If budget record exists, return it (preserves historical data)
  if (budget) {
    return budget;
  }

  // If no budget record exists, return user's default budget
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultBudgetLimit: true },
  });

  // Return a virtual budget object using the user's default
  return {
    id: "", // Virtual budget has no ID
    userId,
    monthlyLimit: user?.defaultBudgetLimit || 0,
    month,
    year,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function updateBudgetLimit(userId: string, limit: number) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Update/create budget record for current month
  await prisma.budget.upsert({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
    update: {
      monthlyLimit: limit,
    },
    create: {
      userId,
      month,
      year,
      monthlyLimit: limit,
    },
  });

  // Also update user's default budget for future months
  await prisma.user.update({
    where: { id: userId },
    data: { defaultBudgetLimit: limit },
  });

  revalidatePath("/");
  revalidatePath("/settings");
}

