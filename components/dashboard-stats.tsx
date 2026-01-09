"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/components/currency-provider";
import { cn } from "@/lib/utils";
import type { GlobalBudget } from "@/lib/prisma";

interface DashboardStatsProps {
  stats: {
    total: number;
    count: number;
  };
  budget: GlobalBudget | { monthlyLimit: number; month: number; year: number };
  forecastAmount?: number;
  carryoverAmount?: number;
}

export function DashboardStats({ stats, budget, forecastAmount = 0, carryoverAmount = 0 }: DashboardStatsProps) {
  const { formatCurrencyAmount } = useCurrency();
  
  // Calculate effective budget after carryover
  const effectiveBudget = budget.monthlyLimit - carryoverAmount;
  
  const totalUsed = stats.total + forecastAmount;
  const adjustedRemaining = effectiveBudget - totalUsed;
  const remaining = Math.max(0, effectiveBudget - stats.total);
  const percentage = effectiveBudget > 0 
    ? (stats.total / effectiveBudget) * 100 
    : 0;
  
  // Calculate total percentage for color indicator
  const totalPercentage = effectiveBudget > 0 
    ? (totalUsed / effectiveBudget) * 100 
    : 0;
  
  // Determine color: red if over limit, yellow if > 80%, default otherwise
  const isOverLimit = totalPercentage > 100;
  const isNearLimit = totalPercentage > 80 && totalPercentage <= 100;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold",
            isOverLimit && "text-red-500",
            isNearLimit && "text-yellow-500"
          )}>
            {formatCurrencyAmount(totalUsed)}
          </div>
          <p className="text-xs text-muted-foreground">
            {forecastAmount > 0 
              ? `${formatCurrencyAmount(stats.total)} spent + ${formatCurrencyAmount(forecastAmount)} forecasted`
              : `${stats.count} expenses this month`}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Limit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-base font-bold">
            {formatCurrencyAmount(effectiveBudget)}
          </div>
          <p className="text-xs text-muted-foreground">
            {carryoverAmount > 0 
              ? `${formatCurrencyAmount(budget.monthlyLimit)} - ${formatCurrencyAmount(carryoverAmount)} carryover`
              : "Monthly budget"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold",
            isOverLimit && "text-red-500",
            isNearLimit && "text-yellow-500"
          )}>
            {formatCurrencyAmount(adjustedRemaining)}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalPercentage.toFixed(1)}% of budget used
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Daily</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrencyAmount(totalUsed / new Date().getDate())}
          </div>
          <p className="text-xs text-muted-foreground">
            Spending per day
          </p>
        </CardContent>
      </Card>
    </>
  );
}

