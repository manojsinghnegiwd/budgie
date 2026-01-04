"use server";

import { prisma } from "@/lib/prisma";

export interface ForecastItem {
  date: Date;
  amount: number;
  type: "bill" | "reminder";
  title: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  };
  id: string;
}

export interface ForecastData {
  items: ForecastItem[];
  dailyTotals: Array<{ date: string; amount: number }>;
  cumulativeData: Array<{ date: string; amount: number; cumulative: number }>;
  summary: {
    totalAmount: number;
    billCount: number;
    reminderCount: number;
  };
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

function generateBillOccurrences(
  bill: {
    id: string;
    title: string;
    amount: number;
    frequency: string;
    dayOfMonth: number | null;
    nextDueDate: Date;
    category: {
      id: string;
      name: string;
      color: string;
      icon: string | null;
    };
  },
  startDate: Date,
  endDate: Date
): ForecastItem[] {
  const occurrences: ForecastItem[] = [];
  let currentDate = new Date(bill.nextDueDate);

  // If the next due date is before start date, calculate the first occurrence in the range
  if (currentDate < startDate) {
    while (currentDate < startDate) {
      currentDate = calculateNextDueDate(
        currentDate,
        bill.frequency as "daily" | "weekly" | "monthly" | "yearly",
        bill.dayOfMonth || undefined
      );
    }
  }

  // Generate occurrences until we exceed the end date
  while (currentDate <= endDate) {
    occurrences.push({
      date: new Date(currentDate),
      amount: bill.amount,
      type: "bill",
      title: bill.title,
      categoryId: bill.category.id,
      category: bill.category,
      id: `${bill.id}-${currentDate.getTime()}`,
    });

    currentDate = calculateNextDueDate(
      currentDate,
      bill.frequency as "daily" | "weekly" | "monthly" | "yearly",
      bill.dayOfMonth || undefined
    );
  }

  return occurrences;
}

export async function getForecastData(
  userId: string,
  days: number = 30
): Promise<ForecastData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  endDate.setHours(23, 59, 59, 999);

  // Fetch active recurring expenses
  const recurringExpenses = await prisma.expense.findMany({
    where: {
      userId,
      type: "recurring",
      isActive: true,
      isProjected: true,
      isPaid: false, // Only include unpaid recurring expenses
    },
    include: {
      category: true,
    },
  });

  // Fetch incomplete reminder expenses with due dates in the forecast window
  const reminderExpenses = await prisma.expense.findMany({
    where: {
      userId,
      type: "reminder",
      isProjected: true,
      isPaid: false, // Only include unpaid reminder expenses
      isCompleted: false,
      date: {
        gte: today,
        lte: endDate,
      },
    },
    include: {
      category: true,
    },
  });

  // Generate bill occurrences
  const billOccurrences: ForecastItem[] = [];
  for (const expense of recurringExpenses) {
    if (!expense.recurringFrequency || !expense.nextDueDate) continue;
    const occurrences = generateBillOccurrences(
      {
        id: expense.id,
        title: expense.description,
        amount: expense.amount,
        frequency: expense.recurringFrequency,
        dayOfMonth: expense.dayOfMonth,
        nextDueDate: expense.nextDueDate,
        category: {
          id: expense.category.id,
          name: expense.category.name,
          color: expense.category.color,
          icon: expense.category.icon,
        },
      },
      today,
      endDate
    );
    billOccurrences.push(...occurrences);
  }

  // Convert reminder expenses to forecast items
  const reminderItems: ForecastItem[] = reminderExpenses.map((expense) => ({
    date: new Date(expense.date),
    amount: expense.amount,
    type: "reminder",
    title: expense.description,
    categoryId: expense.category.id,
    category: {
      id: expense.category.id,
      name: expense.category.name,
      color: expense.category.color,
      icon: expense.category.icon,
    },
    id: expense.id,
  }));

  // Combine and sort by date
  const allItems = [...billOccurrences, ...reminderItems].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Calculate daily totals
  const dailyTotalsMap = new Map<string, number>();
  for (const item of allItems) {
    const dateKey = item.date.toISOString().split("T")[0];
    const current = dailyTotalsMap.get(dateKey) || 0;
    dailyTotalsMap.set(dateKey, current + item.amount);
  }

  const dailyTotals = Array.from(dailyTotalsMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate cumulative data
  let cumulative = 0;
  const cumulativeData = dailyTotals.map((day) => {
    cumulative += day.amount;
    return {
      date: day.date,
      amount: day.amount,
      cumulative,
    };
  });

  // Calculate summary
  const totalAmount = allItems.reduce((sum, item) => sum + item.amount, 0);
  const billCount = billOccurrences.length;
  const reminderCount = reminderItems.length;

  return {
    items: allItems,
    dailyTotals,
    cumulativeData,
    summary: {
      totalAmount,
      billCount,
      reminderCount,
    },
  };
}

export interface MonthForecastSummary {
  totalAmount: number;
  billCount: number;
  reminderCount: number;
}

export async function getMonthForecast(
  userId: string,
  month: number,
  year: number
): Promise<MonthForecastSummary> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate start and end dates for the month
  const startDate = new Date(year, month - 1, 1);
  startDate.setHours(0, 0, 0, 0);
  
  // Only include forecast items from today onwards (not past dates)
  const forecastStartDate = today > startDate ? today : startDate;
  
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // 1. Fetch unpaid expenses that are due (not projected, not paid) in the month
  const unpaidDueExpenses = await prisma.expense.findMany({
    where: {
      userId,
      isProjected: false,
      isPaid: false,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // 2. Fetch projected expenses in the month (actual DB records)
  // These are future recurring/reminder expenses that exist in the database
  const projectedExpenses = await prisma.expense.findMany({
    where: {
      userId,
      isProjected: true,
      isPaid: false, // Only include unpaid projected expenses
      date: {
        gte: forecastStartDate,
        lte: endDate,
      },
    },
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
}

