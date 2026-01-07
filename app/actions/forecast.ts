"use server";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

export interface MonthForecastSummary {
  totalAmount: number;
  billCount: number;
  reminderCount: number;
}

export const getMonthForecast = cache(async (
  userId: string | null,
  month: number,
  year: number,
  categoryIds?: string[] | null
): Promise<MonthForecastSummary> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate start and end dates for the month
  const startDate = new Date(year, month - 1, 1);
  startDate.setHours(0, 0, 0, 0);
  
  // Only include forecast items from today onwards (not past dates)
  const forecastStartDate = today > startDate ? today : startDate;
  
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const whereUnpaid: any = {
    isProjected: false,
    isPaid: false,
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  const whereProjected: any = {
    isProjected: true,
    isPaid: false,
    date: {
      gte: forecastStartDate,
      lte: endDate,
    },
  };

  // If userId is null, fetch for all users (global view)
  // Otherwise, fetch for specific user
  if (userId !== null) {
    whereUnpaid.userId = userId;
    whereProjected.userId = userId;
  }
  // If userId is null, no userId filter - get all expenses

  if (categoryIds && categoryIds.length > 0) {
    whereUnpaid.categoryId = { in: categoryIds };
    whereProjected.categoryId = { in: categoryIds };
  }

  // 1. Fetch unpaid expenses that are due (not projected, not paid) in the month
  const unpaidDueExpenses = await prisma.expense.findMany({
    where: whereUnpaid,
  });

  // 2. Fetch projected expenses in the month (actual DB records)
  // These are future recurring/reminder expenses that exist in the database
  const projectedExpenses = await prisma.expense.findMany({
    where: whereProjected,
  });

  // Calculate totals
  const unpaidDueAmount = unpaidDueExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );
  const projectedAmount = projectedExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  // Count bills and reminders
  const unpaidBills = unpaidDueExpenses.filter(e => e.type === 'recurring').length;
  const unpaidReminders = unpaidDueExpenses.filter(e => e.type === 'reminder').length;
  const projectedBills = projectedExpenses.filter(e => e.type === 'recurring').length;
  const projectedReminders = projectedExpenses.filter(e => e.type === 'reminder').length;

  return {
    totalAmount: unpaidDueAmount + projectedAmount,
    billCount: unpaidBills + projectedBills,
    reminderCount: unpaidReminders + projectedReminders,
  };
});

