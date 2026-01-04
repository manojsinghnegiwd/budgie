"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useCurrency } from "@/components/currency-provider";

interface UserComparisonChartProps {
  data: Array<{
    userId: string;
    userName: string;
    total: number;
    budgetLimit: number;
  }>;
}

export function UserComparisonChart({ data }: UserComparisonChartProps) {
  const { formatCurrencyAmount } = useCurrency();
  
  const chartData = data.map((user) => ({
    name: user.userName,
    spent: user.total,
    budget: user.budgetLimit,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Spending Comparison</CardTitle>
          <CardDescription>
            Compare spending across all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Spending Comparison</CardTitle>
        <CardDescription>
          Compare spending across all users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={(value) => {
                const num = value / 1000;
                return num >= 1 ? `${num.toFixed(0)}k` : value.toString();
              }}
            />
            <Tooltip
              formatter={(value: number) => formatCurrencyAmount(value)}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--card-foreground))",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                opacity: 1,
              }}
            />
            <Legend />
            <Bar dataKey="spent" fill="#ef4444" name="Spent" />
            <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

