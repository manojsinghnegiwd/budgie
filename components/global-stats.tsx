"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/components/currency-provider";

interface GlobalStatsProps {
  overall: {
    total: number;
    budget: number;
    spent: number;
    remaining: number;
    count: number;
  };
}

export function GlobalStats({ overall }: GlobalStatsProps) {
  const { formatCurrencyAmount } = useCurrency();
  const percentage = overall.budget > 0 
    ? (overall.spent / overall.budget) * 100 
    : 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent (All Users)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrencyAmount(overall.total)}</div>
          <p className="text-xs text-muted-foreground">
            {overall.count} expenses across all users
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrencyAmount(overall.budget)}</div>
          <p className="text-xs text-muted-foreground">
            Combined monthly limit
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrencyAmount(overall.remaining)}</div>
          <p className="text-xs text-muted-foreground">
            {percentage.toFixed(1)}% of budget used
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average per User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrencyAmount(overall.total)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total spending
          </p>
        </CardContent>
      </Card>
    </>
  );
}

