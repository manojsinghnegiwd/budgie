"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useUser } from "@/components/user-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import type { Category } from "@/lib/prisma";

interface DashboardControlsProps {
  categories: Category[];
  month: number;
  year: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function DashboardControls({ categories, month, year }: DashboardControlsProps) {
  const router = useRouter();
  const { selectedUserId } = useUser();
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const handleRefresh = useCallback(async () => {
    router.refresh(); // Re-runs all Server Components
  }, [router]);

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

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-8 w-8 md:h-9 md:w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
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
        {selectedUserId && <AddExpenseDialog categories={categories} />}
      </div>
    </div>
  );
}

