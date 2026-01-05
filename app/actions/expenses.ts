"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getExpenses(
  userId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    type?: "regular" | "recurring" | "reminder";
    includeProjected?: boolean;
  }
) {
  const where: any = {
    userId,
  };

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
    },
    orderBy: {
      date: "desc",
    },
  });
}

export async function getExpensesByMonth(
  userId: string,
  month: number,
  year: number,
  includeProjected: boolean = false
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const where: any = {
    userId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (!includeProjected) {
    where.isProjected = false;
  }

  return await prisma.expense.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: {
      date: "desc",
    },
  });
}

export async function getExpenseStats(
  userId: string,
  month: number,
  year: number,
  includeProjected: boolean = false
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const where: any = {
    userId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (!includeProjected) {
    where.isProjected = false;
    where.isPaid = true; // Only count paid expenses as "spent"
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      category: true,
    },
  });

  const total = expenses.reduce((sum: number, expense: typeof expenses[0]) => sum + expense.amount, 0);

  const byCategory: Record<string, { name: string; color: string; amount: number }> = {};
  for (const expense of expenses) {
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
    total,
    byCategory: Object.values(byCategory),
    count: expenses.length,
  };
}

export async function createExpense(
  userId: string,
  data: {
    description: string;
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

  revalidatePath("/");
  revalidatePath("/expenses");

  return expense;
}

export async function updateExpense(
  id: string,
  data: {
    description?: string;
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

  revalidatePath("/");
  revalidatePath("/expenses");

  return expense;
}

export async function deleteExpense(id: string) {
  await prisma.expense.delete({
    where: { id },
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

  revalidatePath("/");
  revalidatePath("/expenses");

  return expenses;
}

export async function createReminderExpense(
  userId: string,
  data: {
    description: string;
    amount: number;
    date: Date;
    categoryId: string;
  }
) {
  const expense = await prisma.expense.create({
    data: {
      userId,
      description: data.description,
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

export async function processRecurringExpenses() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find all projected recurring expenses that are due today or past due
  const dueExpenses = await prisma.expense.findMany({
    where: {
      type: "recurring",
      isProjected: true,
      date: {
        lte: today,
      },
    },
    include: {
      category: true,
    },
  });

  // Mark projected expenses as actual (no longer projected) when their date arrives
  // Keep them as unpaid since they're recurring bills
  const processedExpenses = await prisma.$transaction(
    dueExpenses.map((expense) =>
      prisma.expense.update({
        where: { id: expense.id },
        data: {
          isProjected: false,
          isPaid: false, // Keep recurring expenses as unpaid
        },
        include: {
          category: true,
        },
      })
    )
  );

  if (processedExpenses.length > 0) {
    revalidatePath("/");
    revalidatePath("/expenses");
  }

  return processedExpenses;
}

