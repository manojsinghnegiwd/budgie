"use client";

import { useState, useOptimistic, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EditExpenseDialog } from "@/components/edit-expense-dialog";
import { deleteExpense, markExpenseAsPaid } from "@/app/actions/expenses";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { useCurrency } from "@/components/currency-provider";
import type { Expense, Category } from "@/lib/prisma";

interface ExpensesTableProps {
  expenses: (Expense & { category: Category })[];
  categories: Category[];
}

export function ExpensesTable({ expenses, categories }: ExpensesTableProps) {
  const { formatCurrencyAmount } = useCurrency();
  const [editingExpense, setEditingExpense] = useState<
    (Expense & { category: Category }) | null
  >(null);
  const [isPending, startTransition] = useTransition();
  
  // Optimistic state for expenses
  const [optimisticExpenses, setOptimisticExpense] = useOptimistic(
    expenses,
    (state, { id, isPaid }: { id: string; isPaid: boolean }) =>
      state.map((expense) =>
        expense.id === id ? { ...expense, isPaid } : expense
      )
  );

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      await deleteExpense(id);
    }
  };

  const handleTogglePaid = (id: string, newPaidStatus: boolean) => {
    startTransition(async () => {
      // Optimistically update the UI immediately
      setOptimisticExpense({ id, isPaid: newPaidStatus });
      // Then perform the actual server action
      await markExpenseAsPaid(id, newPaidStatus);
    });
  };

  const total = optimisticExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Paid</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {optimisticExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No expenses yet. Add your first expense to get started!
                </TableCell>
              </TableRow>
            ) : (
              optimisticExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {format(new Date(expense.date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{expense.description}</span>
                      {expense.isProjected && (
                        <Badge variant="outline" className="text-xs">
                          Projected
                        </Badge>
                      )}
                      {expense.type && expense.type !== "regular" && (
                        <Badge 
                          variant={expense.type === "recurring" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {expense.type === "recurring" ? "Recurring" : "Reminder"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: expense.category.color + "20",
                        color: expense.category.color,
                        borderColor: expense.category.color,
                      }}
                    >
                      {expense.category.icon && (
                        <span className="mr-1">{expense.category.icon}</span>
                      )}
                      {expense.category.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrencyAmount(expense.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={expense.isPaid ?? true}
                      onCheckedChange={(checked) => handleTogglePaid(expense.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingExpense(expense)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {optimisticExpenses.length > 0 && (
        <div className="flex justify-end">
          <div className="text-lg font-semibold">
            Total: {formatCurrencyAmount(total)}
          </div>
        </div>
      )}
      {editingExpense && (
        <EditExpenseDialog
          expense={editingExpense}
          categories={categories}
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
        />
      )}
    </div>
  );
}

