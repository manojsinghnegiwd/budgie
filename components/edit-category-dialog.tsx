"use client";

import { useEffect, useState } from "react";
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
import { updateCategory, getCategoryBudgetForMonth, setUserCategoryBudget, deleteUserCategoryBudget } from "@/app/actions/categories";
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

interface EditCategoryDialogProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryUpdated: (category: Category) => void;
  selectedUserId?: string | null;
}

export function EditCategoryDialog({
  category,
  open,
  onOpenChange,
  onCategoryUpdated,
  selectedUserId,
}: EditCategoryDialogProps) {
  const { selectedUserId: contextUserId } = useUser();
  const userId = selectedUserId ?? contextUserId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      color: category.color,
      icon: category.icon || "",
      budgetLimit: category.budgetLimit ?? null,
      isShared: category.isShared ?? false,
    },
  });

  useEffect(() => {
    if (open) {
      const loadBudget = async () => {
        // If not shared, load user's personal budget
        if (!category.isShared && userId) {
          setIsLoadingBudget(true);
          try {
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();
            const userBudget = await getCategoryBudgetForMonth(userId, category.id, month, year);
            form.reset({
              name: category.name,
              color: category.color,
              icon: category.icon || "",
              budgetLimit: userBudget ?? null,
              isShared: category.isShared ?? false,
            });
          } catch (error) {
            console.error("Error loading user budget:", error);
            form.reset({
              name: category.name,
              color: category.color,
              icon: category.icon || "",
              budgetLimit: category.budgetLimit ?? null,
              isShared: category.isShared ?? false,
            });
          } finally {
            setIsLoadingBudget(false);
          }
        } else {
          // Shared category - use category's budgetLimit
          form.reset({
            name: category.name,
            color: category.color,
            icon: category.icon || "",
            budgetLimit: category.budgetLimit ?? null,
            isShared: category.isShared ?? false,
          });
        }
      };
      loadBudget();
    }
  }, [open, category, form, userId]);

  const onSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const isShared = values.isShared ?? false;
      
      // Update category (always update basic fields)
      const updatedCategory = await updateCategory(category.id, {
        name: values.name,
        color: values.color,
        icon: values.icon || undefined,
        budgetLimit: isShared ? (values.budgetLimit || null) : null, // Only set if shared
        isShared: isShared,
      });

      // Handle personal budget if not shared
      if (!isShared && userId) {
        if (values.budgetLimit && values.budgetLimit > 0) {
          // Set user's personal budget
          await setUserCategoryBudget(userId, category.id, values.budgetLimit);
        } else {
          // Clear user's personal budget if limit is removed
          await deleteUserCategoryBudget(userId, category.id);
        }
      } else if (!isShared && !userId) {
        // If no user selected, we can't set personal budget
        console.warn("Cannot set personal budget: no user selected");
      }

      onCategoryUpdated(updatedCategory);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the category details.
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
                      disabled={isLoadingBudget}
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
                {isSubmitting ? "Updating..." : "Update Category"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

