"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getInvestments(
  userId: string,
  filters?: {
    type?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const where: {
    userId: string;
    type?: string;
    purchaseDate?: { gte?: Date; lte?: Date };
  } = {
    userId,
  };

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.startDate || filters?.endDate) {
    where.purchaseDate = {};
    if (filters.startDate) {
      where.purchaseDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.purchaseDate.lte = filters.endDate;
    }
  }

  return await prisma.investment.findMany({
    where,
    orderBy: {
      purchaseDate: "desc",
    },
  });
}

export async function getInvestmentStats(userId: string) {
  const investments = await prisma.investment.findMany({
    where: { userId },
  });

  const totalInvested = investments.reduce(
    (sum, inv) => sum + inv.investedAmount,
    0
  );
  const totalCurrentValue = investments.reduce(
    (sum, inv) => sum + inv.currentValue,
    0
  );
  const totalGainLoss = totalCurrentValue - totalInvested;
  const gainLossPercentage =
    totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  // Group by type
  const byType: Record<
    string,
    { type: string; invested: number; currentValue: number; count: number }
  > = {};
  for (const inv of investments) {
    if (!byType[inv.type]) {
      byType[inv.type] = {
        type: inv.type,
        invested: 0,
        currentValue: 0,
        count: 0,
      };
    }
    byType[inv.type].invested += inv.investedAmount;
    byType[inv.type].currentValue += inv.currentValue;
    byType[inv.type].count += 1;
  }

  return {
    totalInvested,
    totalCurrentValue,
    totalGainLoss,
    gainLossPercentage,
    byType: Object.values(byType),
    count: investments.length,
  };
}

export async function createInvestment(
  userId: string,
  data: {
    name: string;
    type: string;
    investedAmount: number;
    currentValue: number;
    units?: number;
    purchaseDate: Date;
    notes?: string;
  }
) {
  const investment = await prisma.investment.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      investedAmount: data.investedAmount,
      currentValue: data.currentValue,
      units: data.units || null,
      purchaseDate: data.purchaseDate,
      notes: data.notes || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/investments");

  return investment;
}

export async function updateInvestment(
  id: string,
  data: {
    name?: string;
    type?: string;
    investedAmount?: number;
    currentValue?: number;
    units?: number | null;
    purchaseDate?: Date;
    notes?: string | null;
  }
) {
  const investment = await prisma.investment.update({
    where: { id },
    data,
  });

  revalidatePath("/");
  revalidatePath("/investments");

  return investment;
}

export async function deleteInvestment(id: string) {
  await prisma.investment.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/investments");
}

export async function updateInvestmentValue(id: string, currentValue: number) {
  const investment = await prisma.investment.update({
    where: { id },
    data: { currentValue },
  });

  revalidatePath("/");
  revalidatePath("/investments");

  return investment;
}

