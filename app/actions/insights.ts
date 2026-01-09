"use server";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getExpenseStats, getExpensesByMonth } from "./expenses";
import { getBudgetForMonth, getCategoryBudgetSum, getCarryoverAmount } from "./budget";
import { getMonthForecast } from "./forecast";
import { generateInsightText } from "@/lib/openai";

export type InsightType = "start_month" | "mid_month" | "end_month";

export interface InsightData {
  type: InsightType;
  [key: string]: any;
}

export interface Insight {
  type: InsightType;
  data: InsightData;
  text: string;
  generatedAt: Date;
}

/**
 * Determine insight type based on day of month
 */
function getInsightType(day: number): InsightType {
  if (day <= 7) return "start_month";
  if (day <= 20) return "mid_month";
  return "end_month";
}

/**
 * Calculate spending prediction for start of month
 * Uses weighted average of last 3 months
 */
async function calculateSpendingPrediction(
  viewUserId: string | null,
  month: number,
  year: number,
  categoryIds: string[] | null
): Promise<InsightData> {
  const budget = await getBudgetForMonth(month, year);
  let budgetLimit = budget.monthlyLimit;
  
  if (categoryIds && categoryIds.length > 0) {
    const categoryBudgetSum = await getCategoryBudgetSum(viewUserId, categoryIds, month, year);
    if (categoryBudgetSum !== null) {
      budgetLimit = categoryBudgetSum;
    }
  }

  // Get last 3 months of spending
  const months: Array<{ month: number; year: number; total: number }> = [];
  
  for (let i = 1; i <= 3; i++) {
    let prevMonth = month - i;
    let prevYear = year;
    
    while (prevMonth <= 0) {
      prevMonth += 12;
      prevYear -= 1;
    }
    
    const stats = await getExpenseStats(viewUserId, prevMonth, prevYear, false, categoryIds);
    months.push({ month: prevMonth, year: prevYear, total: stats.total });
  }

  // Weighted average (more recent months have higher weight)
  const weights = [0.5, 0.3, 0.2]; // Most recent gets 50%, then 30%, then 20%
  const predictedSpending = months.reduce((sum, m, idx) => sum + m.total * weights[idx], 0);
  
  const difference = budgetLimit - predictedSpending;
  const isOverBudget = predictedSpending > budgetLimit;

  return {
    type: "start_month",
    predictedSpending,
    budget: budgetLimit,
    difference: Math.abs(difference),
    isOverBudget,
    historicalMonths: months,
  };
}

/**
 * Calculate pace alert for mid month
 */
async function calculatePaceAlert(
  viewUserId: string | null,
  month: number,
  year: number,
  categoryIds: string[] | null
): Promise<InsightData> {
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = now.getDate();
  const daysElapsed = currentDay;
  const daysRemaining = daysInMonth - currentDay;

  const [stats, budget, forecast, carryover] = await Promise.all([
    getExpenseStats(viewUserId, month, year, false, categoryIds),
    getBudgetForMonth(month, year),
    getMonthForecast(viewUserId, month, year, categoryIds),
    getCarryoverAmount(month, year, viewUserId, categoryIds),
  ]);

  let budgetLimit = budget.monthlyLimit;
  
  if (categoryIds && categoryIds.length > 0) {
    const categoryBudgetSum = await getCategoryBudgetSum(viewUserId, categoryIds, month, year);
    if (categoryBudgetSum !== null) {
      budgetLimit = categoryBudgetSum;
    }
  }

  const effectiveBudget = budgetLimit - carryover;
  const dailyAverage = stats.total / daysElapsed;
  const projectedTotal = dailyAverage * daysInMonth;
  const overBy = projectedTotal - effectiveBudget;
  const dailyTarget = daysRemaining > 0 ? (effectiveBudget - stats.total) / daysRemaining : 0;

  return {
    type: "mid_month",
    spent: stats.total,
    daysElapsed,
    daysRemaining,
    projectedTotal,
    budget: effectiveBudget,
    overBy: Math.abs(overBy),
    isOverBudget: overBy > 0,
    dailyTarget: Math.max(0, dailyTarget),
    carryover,
  };
}

/**
 * Detect spending anomalies by category
 */
async function detectAnomalies(
  viewUserId: string | null,
  month: number,
  year: number,
  categoryIds: string[] | null
): Promise<InsightData> {
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const currentStats = await getExpenseStats(viewUserId, month, year, false, categoryIds);
  
  // Get last 3 months averages by category
  const historicalByCategory: Record<string, number[]> = {};
  
  for (let i = 1; i <= 3; i++) {
    let prevMonth = month - i;
    let prevYear = year;
    
    while (prevMonth <= 0) {
      prevMonth += 12;
      prevYear -= 1;
    }
    
    const stats = await getExpenseStats(viewUserId, prevMonth, prevYear, false, categoryIds);
    
    for (const cat of stats.byCategory) {
      if (!historicalByCategory[cat.name]) {
        historicalByCategory[cat.name] = [];
      }
      historicalByCategory[cat.name].push(cat.amount);
    }
  }

  // Calculate anomalies
  const anomalies: Array<{
    category: string;
    current: number;
    projected: number;
    average: number;
    deviation: number;
    isHigher: boolean;
  }> = [];

  for (const cat of currentStats.byCategory) {
    const historicalAmounts = historicalByCategory[cat.name] || [];
    if (historicalAmounts.length === 0) continue;
    
    const average = historicalAmounts.reduce((sum, val) => sum + val, 0) / historicalAmounts.length;
    const projected = (cat.amount / currentDay) * daysInMonth;
    const deviation = ((projected - average) / average) * 100;
    
    // Flag if deviation > 30%
    if (Math.abs(deviation) > 30) {
      anomalies.push({
        category: cat.name,
        current: cat.amount,
        projected,
        average,
        deviation,
        isHigher: deviation > 0,
      });
    }
  }

  // Sort by absolute deviation
  anomalies.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

  return {
    type: "mid_month",
    anomalies,
    hasAnomalies: anomalies.length > 0,
    topAnomaly: anomalies[0] || null,
  };
}

/**
 * Get month-over-month progress
 */
async function getMonthOverMonthProgress(
  viewUserId: string | null,
  month: number,
  year: number,
  categoryIds: string[] | null
): Promise<InsightData> {
  const now = new Date();
  const currentDay = now.getDate();
  
  // Get same day last month
  let lastMonth = month - 1;
  let lastYear = year;
  if (lastMonth === 0) {
    lastMonth = 12;
    lastYear -= 1;
  }
  
  const [currentStats, lastMonthExpenses] = await Promise.all([
    getExpenseStats(viewUserId, month, year, false, categoryIds),
    getExpensesByMonth(viewUserId, lastMonth, lastYear, false, categoryIds),
  ]);

  // Calculate spending up to same day last month
  const lastMonthSameDay = lastMonthExpenses
    .filter(exp => new Date(exp.date).getDate() <= currentDay)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const difference = currentStats.total - lastMonthSameDay;
  const percentChange = lastMonthSameDay > 0 ? (difference / lastMonthSameDay) * 100 : 0;

  return {
    type: "mid_month",
    currentSpending: currentStats.total,
    lastMonthSameDay,
    difference: Math.abs(difference),
    percentChange: Math.abs(percentChange),
    isAhead: difference < 0, // Spending less is "ahead"
  };
}

/**
 * Get smart category insights
 */
async function getCategoryInsights(
  viewUserId: string | null,
  month: number,
  year: number,
  categoryIds: string[] | null
): Promise<InsightData> {
  const currentStats = await getExpenseStats(viewUserId, month, year, false, categoryIds);
  
  // Get last 6 months for volatility analysis
  const categoryHistory: Record<string, number[]> = {};
  
  for (let i = 1; i <= 6; i++) {
    let prevMonth = month - i;
    let prevYear = year;
    
    while (prevMonth <= 0) {
      prevMonth += 12;
      prevYear -= 1;
    }
    
    const stats = await getExpenseStats(viewUserId, prevMonth, prevYear, false, categoryIds);
    
    for (const cat of stats.byCategory) {
      if (!categoryHistory[cat.name]) {
        categoryHistory[cat.name] = [];
      }
      categoryHistory[cat.name].push(cat.amount);
    }
  }

  const insights: Array<{
    category: string;
    type: "stable" | "volatile" | "approaching_limit" | "trending_up";
    message: string;
    value?: number;
  }> = [];

  for (const cat of currentStats.byCategory) {
    const history = categoryHistory[cat.name] || [];
    
    if (history.length >= 3) {
      // Check stability
      const avg = history.reduce((sum, val) => sum + val, 0) / history.length;
      const variance = history.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / history.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = avg > 0 ? (stdDev / avg) * 100 : 0;
      
      if (coefficientOfVariation < 15) {
        insights.push({
          category: cat.name,
          type: "stable",
          message: `${cat.name} is predictable`,
          value: avg,
        });
      } else if (coefficientOfVariation > 50) {
        insights.push({
          category: cat.name,
          type: "volatile",
          message: `${cat.name} varies significantly`,
          value: coefficientOfVariation,
        });
      }
      
      // Check if trending up
      const recentThree = history.slice(0, 3);
      const olderThree = history.slice(3, 6);
      if (olderThree.length === 3) {
        const recentAvg = recentThree.reduce((sum, val) => sum + val, 0) / 3;
        const olderAvg = olderThree.reduce((sum, val) => sum + val, 0) / 3;
        const increase = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        if (increase > 15) {
          insights.push({
            category: cat.name,
            type: "trending_up",
            message: `${cat.name} trending upward`,
            value: increase,
          });
        }
      }
    }

    // Check if approaching budget limit
    if (cat.budgetLimit && cat.budgetLimit > 0) {
      const percentUsed = (cat.amount / cat.budgetLimit) * 100;
      if (percentUsed > 75 && percentUsed < 100) {
        insights.push({
          category: cat.name,
          type: "approaching_limit",
          message: `${cat.name} nearing budget limit`,
          value: percentUsed,
        });
      }
    }
  }

  return {
    type: "mid_month",
    insights,
    hasInsights: insights.length > 0,
    topInsight: insights[0] || null,
  };
}

/**
 * Get monthly comparison with previous month
 */
async function getMonthlyComparison(
  viewUserId: string | null,
  month: number,
  year: number,
  categoryIds: string[] | null
): Promise<InsightData> {
  let lastMonth = month - 1;
  let lastYear = year;
  if (lastMonth === 0) {
    lastMonth = 12;
    lastYear -= 1;
  }
  
  const [currentStats, lastStats, currentBudget] = await Promise.all([
    getExpenseStats(viewUserId, month, year, false, categoryIds),
    getExpenseStats(viewUserId, lastMonth, lastYear, false, categoryIds),
    getBudgetForMonth(month, year),
  ]);

  let budgetLimit = currentBudget.monthlyLimit;
  
  if (categoryIds && categoryIds.length > 0) {
    const categoryBudgetSum = await getCategoryBudgetSum(viewUserId, categoryIds, month, year);
    if (categoryBudgetSum !== null) {
      budgetLimit = categoryBudgetSum;
    }
  }

  const difference = currentStats.total - lastStats.total;
  const percentChange = lastStats.total > 0 ? (difference / lastStats.total) * 100 : 0;
  
  // Category-level comparison
  const categoryChanges: Array<{
    name: string;
    current: number;
    previous: number;
    change: number;
  }> = [];

  const lastCategoryMap = new Map(lastStats.byCategory.map(c => [c.name, c.amount]));
  
  for (const cat of currentStats.byCategory) {
    const previousAmount = lastCategoryMap.get(cat.name) || 0;
    const change = cat.amount - previousAmount;
    
    if (Math.abs(change) > 0) {
      categoryChanges.push({
        name: cat.name,
        current: cat.amount,
        previous: previousAmount,
        change,
      });
    }
  }

  categoryChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  
  const underBudget = currentStats.total < budgetLimit;
  const budgetDifference = budgetLimit - currentStats.total;

  return {
    type: "end_month",
    currentTotal: currentStats.total,
    previousTotal: lastStats.total,
    difference: Math.abs(difference),
    percentChange: Math.abs(percentChange),
    isLower: difference < 0,
    budget: budgetLimit,
    underBudget,
    budgetDifference: Math.abs(budgetDifference),
    categoryChanges,
    biggestSavings: categoryChanges.find(c => c.change < 0) || null,
    biggestIncrease: categoryChanges.find(c => c.change > 0) || null,
  };
}

/**
 * Get cached insight from database
 */
async function getCachedInsight(
  viewUserId: string | null,
  month: number,
  year: number,
  insightType: InsightType
): Promise<Insight | null> {
  const cached = await prisma.insightCache.findUnique({
    where: {
      viewUserId_month_year_insightType: {
        viewUserId: viewUserId || "",
        month,
        year,
        insightType,
      },
    },
  });

  if (!cached) return null;

  return {
    type: insightType,
    data: JSON.parse(cached.insightData),
    text: cached.insightText,
    generatedAt: cached.generatedAt,
  };
}

/**
 * Cache insight in database
 */
async function cacheInsight(
  viewUserId: string | null,
  month: number,
  year: number,
  insightType: InsightType,
  data: InsightData,
  text: string
): Promise<void> {
  await prisma.insightCache.upsert({
    where: {
      viewUserId_month_year_insightType: {
        viewUserId: viewUserId || "",
        month,
        year,
        insightType,
      },
    },
    update: {
      insightData: JSON.stringify(data),
      insightText: text,
      generatedAt: new Date(),
    },
    create: {
      viewUserId: viewUserId || "",
      month,
      year,
      insightType,
      insightData: JSON.stringify(data),
      insightText: text,
    },
  });
}

/**
 * Invalidate insight cache for a given month
 * Called when expenses or budgets are modified
 */
export async function invalidateInsightCache(month: number, year: number): Promise<void> {
  await prisma.insightCache.deleteMany({
    where: {
      month,
      year,
    },
  });
}

/**
 * Main entry point: Get insight for dashboard
 */
export const getInsight = cache(async (
  viewUserId: string | null,
  month: number,
  year: number,
  categoryIds: string[] | null = null
): Promise<Insight | null> => {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // Only show insights for current month
  if (month !== currentMonth || year !== currentYear) {
    return null;
  }

  const insightType = getInsightType(currentDay);
  
  // Check cache
  const cached = await getCachedInsight(viewUserId, month, year, insightType);
  if (cached) {
    return cached;
  }

  // Generate new insight
  let data: InsightData;
  
  try {
    switch (insightType) {
      case "start_month":
        data = await calculateSpendingPrediction(viewUserId, month, year, categoryIds);
        break;
      
      case "mid_month": {
        // For mid-month, pick the most relevant insight
        const [pace, anomalies, momProgress, categoryInsights] = await Promise.all([
          calculatePaceAlert(viewUserId, month, year, categoryIds),
          detectAnomalies(viewUserId, month, year, categoryIds),
          getMonthOverMonthProgress(viewUserId, month, year, categoryIds),
          getCategoryInsights(viewUserId, month, year, categoryIds),
        ]);
        
        // Priority: pace alert if over budget > anomaly > mom progress > category insights
        if (pace.isOverBudget) {
          data = pace;
        } else if (anomalies.hasAnomalies) {
          data = anomalies;
        } else if (momProgress.isAhead) {
          data = momProgress;
        } else if (categoryInsights.hasInsights) {
          data = categoryInsights;
        } else {
          data = pace; // Default to pace
        }
        break;
      }
      
      case "end_month":
        data = await getMonthlyComparison(viewUserId, month, year, categoryIds);
        break;
    }
    
    // Generate AI text
    const text = await generateInsightText(data);
    
    // Cache the result
    await cacheInsight(viewUserId, month, year, insightType, data, text);
    
    return {
      type: insightType,
      data,
      text,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating insight:", error);
    return null;
  }
});

