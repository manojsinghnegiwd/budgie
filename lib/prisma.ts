import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Export types - simplified for Prisma 7
export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  type: string;
  isProjected: boolean;
  isPaid: boolean;
  recurringFrequency: string | null;
  dayOfMonth: number | null;
  nextDueDate: Date | null;
  isActive: boolean | null;
  isCompleted: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  category: Category;
};

export type Budget = {
  id: string;
  monthlyLimit: number;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Settings = {
  id: string;
  usdConversionRate: number;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  id: string;
  name: string;
  avatar: string | null;
  defaultBudgetLimit: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Investment = {
  id: string;
  userId: string;
  name: string;
  type: string;
  investedAmount: number;
  currentValue: number;
  units: number | null;
  purchaseDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

