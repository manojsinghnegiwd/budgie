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
import { updateBudgetLimit } from "@/app/actions/budget";
import { useUser } from "@/components/user-provider";
import type { Budget } from "@/lib/prisma";

const budgetSchema = z.object({
  monthlyLimit: z.number().positive("Monthly limit must be positive"),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetSettingsProps {
  budget: Budget;
}

export function BudgetSettings({ budget }: BudgetSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { selectedUserId } = useUser();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      monthlyLimit: budget.monthlyLimit,
    },
  });

  const onSubmit = async (values: BudgetFormValues) => {
    if (!selectedUserId) return;

    setIsSubmitting(true);
    try {
      await updateBudgetLimit(selectedUserId, values.monthlyLimit);
    } catch (error) {
      console.error("Error updating budget:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
        <CardDescription>
          Set your monthly spending limit for the current month.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            <Button type="submit" disabled={isSubmitting || !selectedUserId}>
              {isSubmitting ? "Saving..." : "Save Budget"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

