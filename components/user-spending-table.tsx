"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/components/currency-provider";
import { Progress } from "@/components/ui/progress";

interface UserSpendingTableProps {
  data: Array<{
    userId: string;
    userName: string;
    total: number;
    budgetLimit: number;
    spent: number;
    remaining: number;
    count: number;
  }>;
}

export function UserSpendingTable({ data }: UserSpendingTableProps) {
  const { formatCurrencyAmount } = useCurrency();

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Spending Breakdown</CardTitle>
          <CardDescription>
            Detailed spending by user
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
        <CardTitle>User Spending Breakdown</CardTitle>
        <CardDescription>
          Detailed spending by user
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Spent</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Expenses</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((user) => {
              const percentage = user.budgetLimit > 0
                ? (user.spent / user.budgetLimit) * 100
                : 0;
              const isOverBudget = user.spent > user.budgetLimit;

              return (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">{user.userName}</TableCell>
                  <TableCell>
                    <span className={isOverBudget ? "text-destructive font-semibold" : ""}>
                      {formatCurrencyAmount(user.spent)}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrencyAmount(user.budgetLimit)}</TableCell>
                  <TableCell>
                    <span className={user.remaining < 0 ? "text-destructive" : ""}>
                      {formatCurrencyAmount(user.remaining)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-32">
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-12">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.count}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

