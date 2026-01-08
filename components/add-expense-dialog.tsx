"use client";

import { useState, useEffect } from "react";
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
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExpense, createRecurringExpense, createReminderExpense } from "@/app/actions/expenses";
import { Plus } from "lucide-react";
import { useUser } from "@/components/user-provider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Category } from "@/lib/prisma";

const expenseSchema = z.object({
  userId: z.string().min(1, "User is required"),
  description: z.string().min(1, "Description is required"),
  additionalDescription: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  date: z.date(),
  categoryId: z.string().min(1, "Category is required"),
});

const recurringExpenseSchema = expenseSchema.extend({
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  dayOfMonth: z.number().min(1).max(31).optional(),
  startDate: z.date(),
  endDate: z.date(),
});

const reminderExpenseSchema = expenseSchema;

type ExpenseFormValues = z.infer<typeof expenseSchema>;
type RecurringExpenseFormValues = z.infer<typeof recurringExpenseSchema>;
type ReminderExpenseFormValues = z.infer<typeof reminderExpenseSchema>;

interface AddExpenseDialogProps {
  categories: Category[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function AddExpenseDialog({ 
  categories, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  showTrigger = true 
}: AddExpenseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseType, setExpenseType] = useState<"regular" | "recurring" | "reminder">("regular");
  const { selectedUserId, users } = useUser();

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      userId: selectedUserId || "",
      description: "",
      additionalDescription: "",
      amount: 0,
      date: new Date(),
      categoryId: "",
    },
  });

  const recurringForm = useForm<RecurringExpenseFormValues>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: {
      userId: selectedUserId || "",
      description: "",
      additionalDescription: "",
      amount: 0,
      date: new Date(),
      categoryId: "",
      frequency: "monthly",
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  const reminderForm = useForm<ReminderExpenseFormValues>({
    resolver: zodResolver(reminderExpenseSchema),
    defaultValues: {
      userId: selectedUserId || "",
      description: "",
      additionalDescription: "",
      amount: 0,
      date: new Date(),
      categoryId: "",
    },
  });

  // Reset expense type and forms when dialog opens
  useEffect(() => {
    if (open) {
      setExpenseType("regular");
      const defaultUserId = selectedUserId || "";
      form.reset({
        userId: defaultUserId,
        description: "",
        additionalDescription: "",
        amount: 0,
        date: new Date(),
        categoryId: "",
      });
      recurringForm.reset({
        userId: defaultUserId,
        description: "",
        additionalDescription: "",
        amount: 0,
        date: new Date(),
        categoryId: "",
        frequency: "monthly",
        startDate: new Date(),
        endDate: new Date(),
      });
      reminderForm.reset({
        userId: defaultUserId,
        description: "",
        additionalDescription: "",
        amount: 0,
        date: new Date(),
        categoryId: "",
      });
    }
  }, [open, selectedUserId, form, recurringForm, reminderForm]);

  // Update form defaults when selectedUserId changes (when dialog is already open)
  useEffect(() => {
    if (selectedUserId && open) {
      form.setValue("userId", selectedUserId);
      recurringForm.setValue("userId", selectedUserId);
      reminderForm.setValue("userId", selectedUserId);
    }
  }, [selectedUserId, open, form, recurringForm, reminderForm]);

  const onSubmit = async (values: ExpenseFormValues) => {
    if (!values.userId) return;

    setIsSubmitting(true);
    try {
      await createExpense(values.userId, {
        description: values.description,
        additionalDescription: values.additionalDescription,
        amount: values.amount,
        date: values.date,
        categoryId: values.categoryId,
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error creating expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitRecurring = async (values: RecurringExpenseFormValues) => {
    if (!values.userId) return;

    setIsSubmitting(true);
    try {
      await createRecurringExpense(values.userId, {
        description: values.description,
        additionalDescription: values.additionalDescription,
        amount: values.amount,
        categoryId: values.categoryId,
        frequency: values.frequency,
        dayOfMonth: values.dayOfMonth,
        startDate: values.startDate,
        endDate: values.endDate,
      });
      recurringForm.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error creating recurring expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitReminder = async (values: ReminderExpenseFormValues) => {
    if (!values.userId) return;

    setIsSubmitting(true);
    try {
      await createReminderExpense(values.userId, {
        description: values.description,
        additionalDescription: values.additionalDescription,
        amount: values.amount,
        date: values.date,
        categoryId: values.categoryId,
      });
      reminderForm.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error creating reminder:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogContent = (
    <>
      <DialogHeader>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogDescription>
          Record a new expense, recurring bill, or reminder.
        </DialogDescription>
      </DialogHeader>
      <Tabs value={expenseType} onValueChange={(value) => setExpenseType(value as "regular" | "recurring" | "reminder")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="regular">Regular</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="reminder">Reminder</TabsTrigger>
        </TabsList>
          
          <TabsContent value="regular">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="additionalDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details (Optional)</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Add more context for better search (e.g., bought at Costco, with coupon)"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        field.onChange(new Date(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            {category.icon && <span>{category.icon}</span>}
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !form.watch("userId")}>
                    {isSubmitting ? "Adding..." : "Add Expense"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="recurring">
            <Form {...recurringForm}>
              <form onSubmit={recurringForm.handleSubmit(onSubmitRecurring)} className="space-y-4">
                <FormField
                  control={recurringForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={recurringForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Rent" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={recurringForm.control}
                  name="additionalDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Details (Optional)</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Add more context for better search"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={recurringForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={recurringForm.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {recurringForm.watch("frequency") === "monthly" || recurringForm.watch("frequency") === "yearly" ? (
                  <FormField
                    control={recurringForm.control}
                    name="dayOfMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Month</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="e.g., 15"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
                <FormField
                  control={recurringForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value
                              ? new Date(field.value).toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={recurringForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value
                              ? new Date(field.value).toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={recurringForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                {category.icon && <span>{category.icon}</span>}
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !recurringForm.watch("userId")}>
                    {isSubmitting ? "Adding..." : "Add Recurring Bill"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="reminder">
            <Form {...reminderForm}>
              <form onSubmit={reminderForm.handleSubmit(onSubmitReminder)} className="space-y-4">
                <FormField
                  control={reminderForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reminderForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Car Insurance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reminderForm.control}
                  name="additionalDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Details (Optional)</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Add more context for better search"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reminderForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reminderForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value
                              ? new Date(field.value).toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reminderForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                {category.icon && <span>{category.icon}</span>}
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !reminderForm.watch("userId")}>
                    {isSubmitting ? "Adding..." : "Add Reminder"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
    </>
  );

  // If controlled (no trigger), just return the content
  if (!showTrigger) {
    return dialogContent;
  }

  // Otherwise, return the full dialog with trigger
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent>
        {dialogContent}
      </DialogContent>
    </Dialog>
  );
}

