"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useCurrency } from "@/components/currency-provider";
import { format } from "date-fns";
import { useMemo } from "react";
import type { Expense, Category } from "@/lib/prisma";

// Generate a random vibrant color
function generateRandomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 65 + Math.floor(Math.random() * 20); // 65-85%
  const lightness = 50 + Math.floor(Math.random() * 15); // 50-65%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

interface MonthComparisonProps {
  currentExpenses: (Expense & { category: Category })[];
  previousExpenses: (Expense & { category: Category })[];
  currentMonth: number;
  currentYear: number;
}

export function MonthComparison({
  currentExpenses,
  previousExpenses,
  currentMonth,
  currentYear,
}: MonthComparisonProps) {
  const { formatCurrencyAmount } = useCurrency();
  const currentTotal = currentExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );
  const previousTotal = previousExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  // Calculate previous month
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const currentMonthName = format(new Date(currentYear, currentMonth - 1, 1), "MMMM");
  const previousMonthName = format(new Date(prevYear, prevMonth - 1, 1), "MMMM");

  // Generate random colors for each bar (memoized to prevent color changes on re-render)
  const barColors = useMemo(() => [
    generateRandomColor(),
    generateRandomColor(),
  ], []);

  const data = [
    {
      month: previousMonthName,
      amount: previousTotal,
    },
    {
      month: currentMonthName,
      amount: currentTotal,
    },
  ];

  const change = previousTotal > 0 
    ? ((currentTotal - previousTotal) / previousTotal) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Month Comparison</CardTitle>
        <CardDescription>
          Compare current vs previous month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number | undefined) => 
                value !== undefined ? formatCurrencyAmount(value) : formatCurrencyAmount(0)
              }
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--card-foreground))",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                opacity: 1,
              }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={barColors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {change > 0 ? (
              <span className="text-destructive">
                ↑ {change.toFixed(1)}% increase
              </span>
            ) : change < 0 ? (
              <span className="text-green-500">
                ↓ {Math.abs(change).toFixed(1)}% decrease
              </span>
            ) : (
              <span>No change</span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

