"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/user-provider";
import { getExpenses } from "@/app/actions/expenses";
import { getCategories } from "@/app/actions/categories";
import { ExpensesTable } from "@/components/expenses-table";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Expense, Category } from "@/lib/prisma";

export default function ExpensesPage() {
  const { selectedUserId } = useUser();
  const [expenses, setExpenses] = useState<(Expense & { category: Category })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseType, setExpenseType] = useState<"all" | "regular" | "recurring" | "reminder">("all");
  const [includeProjected, setIncludeProjected] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    if (!selectedUserId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [expensesData, categoriesData] = await Promise.all([
          getExpenses(selectedUserId, {
            type: expenseType === "all" ? undefined : expenseType,
            includeProjected: includeProjected ? undefined : false,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
          }),
          getCategories(),
        ]);
        setExpenses(expensesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedUserId, expenseType, includeProjected, startDate, endDate]);

  if (!selectedUserId) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="text-muted-foreground mt-4">Please select a user from the sidebar.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <AddExpenseDialog categories={categories} />
      </div>
      <div className="mb-6 space-y-4">
        <Tabs value={expenseType} onValueChange={(value) => setExpenseType(value as typeof expenseType)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="regular">Regular</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
            <TabsTrigger value="reminder">Reminders</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="include-projected"
              checked={includeProjected}
              onCheckedChange={setIncludeProjected}
            />
            <Label htmlFor="include-projected">Include projected expenses</Label>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>
            {(startDate || endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>
      <ExpensesTable expenses={expenses} categories={categories} />
    </div>
  );
}
