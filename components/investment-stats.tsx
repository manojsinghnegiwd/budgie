"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/components/currency-provider";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvestmentStatsProps {
  stats: {
    totalInvested: number;
    totalCurrentValue: number;
    totalGainLoss: number;
    gainLossPercentage: number;
    count: number;
  };
}

export function InvestmentStats({ stats }: InvestmentStatsProps) {
  const { formatCurrencyAmount } = useCurrency();
  const isPositive = stats.totalGainLoss >= 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrencyAmount(stats.totalInvested)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across {stats.count} investment{stats.count !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Value</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrencyAmount(stats.totalCurrentValue)}
          </div>
          <p className="text-xs text-muted-foreground">Portfolio value today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold",
              isPositive ? "text-green-500" : "text-red-500"
            )}
          >
            {isPositive ? "+" : ""}
            {formatCurrencyAmount(stats.totalGainLoss)}
          </div>
          <p
            className={cn(
              "text-xs",
              isPositive ? "text-green-500" : "text-red-500"
            )}
          >
            {isPositive ? "+" : ""}
            {stats.gainLossPercentage.toFixed(2)}% overall return
          </p>
        </CardContent>
      </Card>
    </>
  );
}

interface InvestmentSummaryCardProps {
  stats: {
    totalInvested: number;
    totalCurrentValue: number;
    totalGainLoss: number;
    gainLossPercentage: number;
    count: number;
    byType: Array<{
      type: string;
      invested: number;
      currentValue: number;
      count: number;
    }>;
  };
}

export function InvestmentSummaryCard({ stats }: InvestmentSummaryCardProps) {
  const { formatCurrencyAmount } = useCurrency();
  const isPositive = stats.totalGainLoss >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Investment Portfolio</span>
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Invested</p>
            <p className="text-xl font-bold">
              {formatCurrencyAmount(stats.totalInvested)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Value</p>
            <p className="text-xl font-bold">
              {formatCurrencyAmount(stats.totalCurrentValue)}
            </p>
          </div>
        </div>
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Returns</span>
            <span
              className={cn(
                "font-semibold",
                isPositive ? "text-green-500" : "text-red-500"
              )}
            >
              {isPositive ? "+" : ""}
              {formatCurrencyAmount(stats.totalGainLoss)} (
              {isPositive ? "+" : ""}
              {stats.gainLossPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
        {stats.count === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No investments yet. Start tracking your portfolio!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
