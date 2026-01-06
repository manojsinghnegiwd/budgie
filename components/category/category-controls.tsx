"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useUser } from "@/components/user-provider";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { Category } from "@/lib/prisma";

interface CategoryControlsProps {
  category: Category;
  categoryBudget: number | null;
  categories: Category[];
  month: number;
  year: number;
  onRefresh: () => void;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CategoryControls({
  category,
  categoryBudget,
  categories,
  month,
  year,
  onRefresh,
}: CategoryControlsProps) {
  const router = useRouter();
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const updateMonth = useCallback((newMonth: string) => {
    const params = new URLSearchParams();
    params.set("month", newMonth);
    params.set("year", year.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, year]);

  const updateYear = useCallback((newYear: string) => {
    const params = new URLSearchParams();
    params.set("month", month.toString());
    params.set("year", newYear);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, month]);

  // Listen for refresh event from mobile header
  useEffect(() => {
    const handleRefreshEvent = () => {
      onRefresh();
    };
    window.addEventListener('refresh-page', handleRefreshEvent);
    return () => window.removeEventListener('refresh-page', handleRefreshEvent);
  }, [onRefresh]);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          {category.icon && <span className="text-3xl">{category.icon}</span>}
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                {category.name}
                <Badge
                  style={{
                    backgroundColor: category.color + "20",
                    color: category.color,
                    borderColor: category.color,
                  }}
                  className="text-xs"
                >
                  Category
                </Badge>
              </h1>
              {categoryBudget !== null && categoryBudget > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Budget: {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(categoryBudget)}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              className="h-8 w-8 md:h-9 md:w-9"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={month.toString()}
            onValueChange={updateMonth}
          >
            <SelectTrigger className="w-[120px] md:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((monthName, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={year.toString()}
            onValueChange={updateYear}
          >
            <SelectTrigger className="w-[90px] md:w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((yearOption) => (
                <SelectItem key={yearOption} value={yearOption.toString()}>
                  {yearOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="hidden md:block">
        <AddExpenseDialog categories={categories} />
      </div>
    </div>
  );
}

