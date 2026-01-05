"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/components/currency-provider";
import type { GlobalBudget } from "@/lib/prisma";
import { cn } from "@/lib/utils";

interface BudgetProgressProps {
  budget: GlobalBudget | { monthlyLimit: number; month: number; year: number };
  spent: number;
  forecastAmount?: number;
}

export function BudgetProgress({ budget, spent, forecastAmount = 0 }: BudgetProgressProps) {
  const { formatCurrencyAmount } = useCurrency();
  
  const spentPercentage = budget.monthlyLimit > 0 
    ? Math.min(100, (spent / budget.monthlyLimit) * 100) 
    : 0;
  
  const forecastPercentage = budget.monthlyLimit > 0
    ? Math.min(100 - spentPercentage, (forecastAmount / budget.monthlyLimit) * 100)
    : 0;
  
  const totalUsed = spent + forecastAmount;
  const adjustedRemaining = Math.max(0, budget.monthlyLimit - totalUsed);
  const remaining = Math.max(0, budget.monthlyLimit - spent);
  
  const daysInMonth = new Date(budget.year, budget.month, 0).getDate();
  const daysPassed = new Date().getDate();
  const expectedSpending = (budget.monthlyLimit / daysInMonth) * daysPassed;
  const burnRate = expectedSpending > 0 ? (spent / expectedSpending) * 100 : 0;
  
  const isOverBudget = totalUsed > budget.monthlyLimit;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Progress</CardTitle>
        <CardDescription>
          Global spending progress for this month
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Spent</span>
            <span className="font-medium">{formatCurrencyAmount(spent)}</span>
          </div>
          {forecastAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Forecasted</span>
              <span className="font-medium text-amber-600 dark:text-amber-500">
                {formatCurrencyAmount(forecastAmount)}
              </span>
            </div>
          )}
          
          {/* Stacked Progress Bar */}
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
            {/* Spent segment (primary color) */}
            {spentPercentage > 0 && (
              <div
                className="absolute left-0 top-0 h-full bg-primary transition-all"
                style={{ width: `${spentPercentage}%` }}
              />
            )}
            {/* Forecasted segment (amber/orange color) */}
            {forecastPercentage > 0 && (
              <div
                className="absolute top-0 h-full bg-amber-500 transition-all"
                style={{ 
                  left: `${spentPercentage}%`,
                  width: `${forecastPercentage}%` 
                }}
              />
            )}
          </div>
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Adjusted Remaining</span>
            <span className={cn(
              "font-medium",
              isOverBudget && "text-destructive"
            )}>
              {formatCurrencyAmount(adjustedRemaining)}
            </span>
          </div>
          {forecastAmount === 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Remaining</span>
              <span>{formatCurrencyAmount(remaining)}</span>
            </div>
          )}
        </div>
        
        {isOverBudget && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive font-medium">
              Warning: Forecasted expenses exceed your budget limit
            </p>
          </div>
        )}
        
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Burn Rate</span>
            <span className={cn(
              "text-sm font-medium",
              burnRate > 100 ? "text-destructive" : "text-green-500"
            )}>
              {burnRate.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {burnRate > 100 
              ? "You're spending faster than expected" 
              : "You're on track with your budget"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

