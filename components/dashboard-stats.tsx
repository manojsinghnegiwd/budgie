"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/components/currency-provider";
import type { Budget } from "@/lib/prisma";

interface DashboardStatsProps {
  stats: {
    total: number;
    count: number;
  };
  budget: Budget;
  forecastAmount?: number;
}

export function DashboardStats({ stats, budget, forecastAmount = 0 }: DashboardStatsProps) {
  const { formatCurrencyAmount } = useCurrency();
  const totalUsed = stats.total + forecastAmount;
  const adjustedRemaining = Math.max(0, budget.monthlyLimit - totalUsed);
  const remaining = Math.max(0, budget.monthlyLimit - stats.total);
  const percentage = budget.monthlyLimit > 0 
    ? (stats.total / budget.monthlyLimit) * 100 
    : 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrencyAmount(stats.total)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.count} expenses this month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Limit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-base font-bold">
            {formatCurrencyAmount(adjustedRemaining)} / {formatCurrencyAmount(budget.monthlyLimit)}
          </div>
          <p className="text-xs text-muted-foreground">
            Adjusted remaining / Total limit
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrencyAmount(remaining)}</div>
          <p className="text-xs text-muted-foreground">
            {percentage.toFixed(1)}% of budget used
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Daily</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrencyAmount(stats.total / new Date().getDate())}
          </div>
          <p className="text-xs text-muted-foreground">
            Spending per day
          </p>
        </CardContent>
      </Card>
    </>
  );
}

