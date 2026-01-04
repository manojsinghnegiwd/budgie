"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { useCurrency } from "@/components/currency-provider";
import type { Expense, Category } from "@/lib/prisma";

interface SpendingTrendsProps {
  expenses: (Expense & { category: Category })[];
  month: number;
  year: number;
}

export function SpendingTrends({ expenses, month, year }: SpendingTrendsProps) {
  const { formatCurrencyAmount } = useCurrency();
  const now = new Date();
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(new Date(year, month - 1, 1));
  
  // For current month, show up to today. For past/future months, show full month
  const endDate = 
    month === now.getMonth() + 1 && year === now.getFullYear()
      ? now
      : monthEnd;
  
  const days = eachDayOfInterval({
    start: monthStart,
    end: endDate,
  });

  const dailyData = days.map((day) => {
    const dayExpenses = expenses.filter((expense) =>
      isSameDay(new Date(expense.date), day)
    );
    const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    return {
      date: format(day, "MMM dd"),
      amount: total,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trends</CardTitle>
        <CardDescription>
          Daily spending this month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
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
            <Line
              type="monotone"
              dataKey="amount"
              stroke="white"
              strokeWidth={2}
              name="Daily Spending"
              dot={{ fill: "white", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

