"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/components/currency-provider";
import { cn } from "@/lib/utils";

interface CategoryBudgetData {
  name: string;
  color: string;
  amount: number;
  budgetLimit: number | null;
  categoryId?: string;
}

interface CategoryBudgetProgressProps {
  categories: CategoryBudgetData[];
  month: number;
  year: number;
  forecastAmounts?: Record<string, number>; // categoryId -> forecast amount
  carryoverAmounts?: Record<string, number>; // categoryId -> carryover amount
  hideHeader?: boolean; // Hide the header section
}

export function CategoryBudgetProgress({ 
  categories, 
  month, 
  year,
  forecastAmounts = {},
  carryoverAmounts = {},
  hideHeader = false
}: CategoryBudgetProgressProps) {
  const { formatCurrencyAmount } = useCurrency();

  // Filter categories that have budget limits set
  const categoriesWithLimits = categories.filter(
    (cat) => cat.budgetLimit !== null && cat.budgetLimit > 0
  );

  if (categoriesWithLimits.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Category Budgets</h2>
          <p className="text-sm text-muted-foreground">
            Budget progress for each category this month
          </p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categoriesWithLimits.map((category) => {
          const forecastAmount = category.categoryId 
            ? (forecastAmounts[category.categoryId] || 0)
            : 0;
          const carryoverAmount = category.categoryId 
            ? (carryoverAmounts[category.categoryId] || 0)
            : 0;
          const limit = category.budgetLimit!;
          
          // Calculate effective budget after carryover
          const effectiveBudget = limit - carryoverAmount;
          
          // Calculate percentages based on ORIGINAL budget for visual representation
          const carryoverPercentage = limit > 0 
            ? (carryoverAmount / limit) * 100 
            : 0;
          
          const spentPercentage = limit > 0 
            ? Math.min(100 - carryoverPercentage, (category.amount / limit) * 100) 
            : 0;
          
          const forecastPercentage = limit > 0
            ? Math.min(100 - carryoverPercentage - spentPercentage, (forecastAmount / limit) * 100)
            : 0;
          
          const totalUsed = category.amount + forecastAmount;
          const adjustedRemaining = Math.max(0, effectiveBudget - totalUsed);
          const remaining = Math.max(0, effectiveBudget - category.amount);
          
          const daysInMonth = new Date(year, month, 0).getDate();
          const daysPassed = new Date().getDate();
          const expectedSpending = (effectiveBudget / daysInMonth) * daysPassed;
          const burnRate = expectedSpending > 0 ? (category.amount / expectedSpending) * 100 : 0;
          
          const isOverBudget = totalUsed > effectiveBudget;

          return (
            <Card key={category.name}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <CardTitle className="text-base">{category.name}</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Limit: {formatCurrencyAmount(limit)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {carryoverAmount > 0 && (
                    <div className="flex justify-between text-xs bg-destructive/10 border border-destructive/20 rounded p-2">
                      <span className="text-destructive">Carried Over</span>
                      <span className="font-semibold text-destructive">
                        {formatCurrencyAmount(carryoverAmount)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Spent</span>
                    <span className="font-medium">{formatCurrencyAmount(category.amount)}</span>
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
                    {/* Carryover segment (red) */}
                    {carryoverPercentage > 0 && (
                      <div
                        className="absolute left-0 top-0 h-full bg-destructive transition-all"
                        style={{ width: `${carryoverPercentage}%` }}
                      />
                    )}
                    {/* Spent segment (category color) */}
                    {spentPercentage > 0 && (
                      <div
                        className="absolute top-0 h-full transition-all"
                        style={{ 
                          left: `${carryoverPercentage}%`,
                          width: `${spentPercentage}%`,
                          backgroundColor: category.color
                        }}
                      />
                    )}
                    {/* Forecasted segment (amber/orange color) */}
                    {forecastPercentage > 0 && (
                      <div
                        className="absolute top-0 h-full bg-amber-500 transition-all"
                        style={{ 
                          left: `${carryoverPercentage + spentPercentage}%`,
                          width: `${forecastPercentage}%` 
                        }}
                      />
                    )}
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Remaining</span>
                    <span className={cn(
                      "font-medium",
                      isOverBudget && "text-destructive"
                    )}>
                      {formatCurrencyAmount(adjustedRemaining)}
                    </span>
                  </div>
                </div>
                
                {isOverBudget && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2">
                    <p className="text-xs text-destructive font-medium">
                      Over budget
                    </p>
                  </div>
                )}
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Burn Rate</span>
                    <span className={cn(
                      "text-xs font-medium",
                      burnRate > 100 ? "text-destructive" : "text-green-500"
                    )}>
                      {burnRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

