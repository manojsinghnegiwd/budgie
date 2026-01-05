"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { createCategory, setUserCategoryBudget } from "@/app/actions/categories";
import { useUser } from "@/components/user-provider";
import type { Category } from "@/lib/prisma";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  icon: z.string().optional(),
  budgetLimit: z.number().positive().optional().nullable(),
  isShared: z.boolean().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: (category: Category) => void;
  selectedUserId?: string | null;
}

export function AddCategoryDialog({
  open,
  onOpenChange,
  onCategoryAdded,
  selectedUserId,
}: AddCategoryDialogProps) {
  const { selectedUserId: contextUserId } = useUser();
  const userId = selectedUserId ?? contextUserId;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      color: "#6b7280",
      icon: "",
      budgetLimit: null,
      isShared: false,
    },
  });

  const onSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const isShared = values.isShared ?? false;
      
      // Create category (only set budgetLimit if shared)
      const category = await createCategory({
        name: values.name,
        color: values.color,
        icon: values.icon || undefined,
        budgetLimit: isShared ? (values.budgetLimit || null) : null, // Only set if shared
        isShared: isShared,
      });

      // Handle personal budget if not shared
      if (!isShared && userId && values.budgetLimit && values.budgetLimit > 0) {
        // Set user's personal budget for the new category
        await setUserCategoryBudget(userId, category.id, values.budgetLimit);
      } else if (!isShared && !userId) {
        // If no user selected, we can't set personal budget
        console.warn("Cannot set personal budget: no user selected");
      }

      onCategoryAdded(category);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Create a new expense category.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        {...field}
                        className="h-10 w-20"
                      />
                      <Input
                        type="text"
                        placeholder="#6b7280"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon (emoji, optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 🍔" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budgetLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Limit (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                  {!form.watch("isShared") && !userId && (
                    <p className="text-xs text-muted-foreground">
                      Please select a user to set a personal budget
                    </p>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isShared"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Shared Category</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {field.value
                        ? "All users can see expenses in this category"
                        : "Only the expense creator can see their expenses"}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Category"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

