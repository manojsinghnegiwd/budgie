"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { updateBudgetLimit } from "@/app/actions/budget";
import { updateBudgetCarryover } from "@/app/actions/settings";
import type { GlobalBudget } from "@/lib/prisma";

const budgetSchema = z.object({
  monthlyLimit: z.number().positive("Monthly limit must be positive"),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetSettingsProps {
  budget: GlobalBudget | { monthlyLimit: number; month: number; year: number };
  enableBudgetCarryover?: boolean;
}

export function BudgetSettings({ budget, enableBudgetCarryover = false }: BudgetSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carryoverEnabled, setCarryoverEnabled] = useState(enableBudgetCarryover);
  const [isUpdatingCarryover, setIsUpdatingCarryover] = useState(false);

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      monthlyLimit: budget.monthlyLimit,
    },
  });

  const onSubmit = async (values: BudgetFormValues) => {
    setIsSubmitting(true);
    try {
      await updateBudgetLimit(values.monthlyLimit);
    } catch (error) {
      console.error("Error updating budget:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCarryoverToggle = async (enabled: boolean) => {
    setIsUpdatingCarryover(true);
    try {
      await updateBudgetCarryover(enabled);
      setCarryoverEnabled(enabled);
    } catch (error) {
      console.error("Error updating carryover setting:", error);
    } finally {
      setIsUpdatingCarryover(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
        <CardDescription>
          Set the global monthly spending limit for the current month. This budget is shared across all users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="monthlyLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Limit (INR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Budget"}
            </Button>
          </form>
        </Form>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Budget Carryover
              </label>
              <p className="text-sm text-muted-foreground">
                When enabled, any overspending from last month will reduce your available budget this month
              </p>
            </div>
            <Switch 
              checked={carryoverEnabled} 
              onCheckedChange={handleCarryoverToggle}
              disabled={isUpdatingCarryover}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

